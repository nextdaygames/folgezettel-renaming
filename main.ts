import { MetadataCache, MarkdownRenderer, Plugin, ItemView, WorkspaceLeaf } from 'obsidian';



function getFolgeIdentifier (filename: string) {
	const tokens = filename.split(" ")
	return tokens[0]
}

function isFolgeFile (folgeIdentifier: string) {
	return  /^[0-9]+[a-zA-Z]*/.test(folgeIdentifier)
}

function getFolgeTokens(folgeIdentifier: string) {
	// console.log("parsing", folgeIdentifier)
	let tokens: Array<string> = []
	var currentToken = ""
	var isNumeric = true
	for (var c = 0; c < folgeIdentifier.length; c++) {
		var currentCharacter = folgeIdentifier[c]
		var isNumber = /[0-9]/.test(currentCharacter)
		if (isNumeric == isNumber) {
			// console.log(currentCharacter + " is still a " + (isNumeric ? "number" : "alpha") + " add it to the token")
			// console.log("currentToken -> ", currentToken+currentCharacter)
			currentToken = currentToken + currentCharacter
			continue
		}
		// console.log(currentCharacter + " is not a " + (isNumeric ? "number" : "alpha") + " clip off the current token")
		isNumeric = !isNumeric
		tokens.push(currentToken)
		currentToken = currentCharacter
	}
	if (currentToken.length > 0) {
		tokens.push(currentToken)
	}
	// console.log(folgeIdentifier, tokens)
	return tokens
}

function isDirectParent(folgeTokens: string[], suspectedParentTokens: string[]) {
	if (folgeTokens.length - suspectedParentTokens.length !== 1) {
		return false
	}
	for (var i = 0; i < suspectedParentTokens.length ; i++) {
		if (folgeTokens[i] != suspectedParentTokens[i]) {
			return false
		}
	}
	return true
}

function isDirectChild(folgeTokens: string[], suspectedChild: string[]) {
	if (suspectedChild.length - folgeTokens.length !== 1) {
		return false
	}
	for (var i = 0; i < folgeTokens.length ; i++) {
		if (folgeTokens[i] != suspectedChild[i]) {
			return false
		}
	}
	return true
}

function isSibling(folgeTokens: string[], siblingTokens: string[]) {
	if (folgeTokens.length !== siblingTokens.length) {
		return false
	}
	for (var i = 0; i < folgeTokens.length-1 ; i++) {
		if (folgeTokens[i] != siblingTokens[i]) {
			return false
		}
	}
	return true
}

const folgezettelViewType = "folgezettel-view"
class FolgezettelView extends ItemView {
	// markdownRenderer
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// this.markdownRenderer = new MarkdownRenderer(this);
	}
  
	getViewType() {
	  return folgezettelViewType
	}
  
	getDisplayText() {
		return "Folgezettel View"
	}
  
	async onOpen() {
		var folgezettels = this.calculateFolgezettels()
		this.renderFolgezettels(folgezettels)
	}

	calculateFolgezettels() {
		
		var fileName = this.app.workspace.activeEditor?.file?.name
		if (fileName === undefined) {
			// console.log("No filename")
			return undefined
		}
		var folgeIdentifier = getFolgeIdentifier(fileName)
		if (!isFolgeFile(folgeIdentifier)) {
			// console.log(folgeIdentifier + " is not a folge identifier.")
			return undefined
		}
		var source = this.app.workspace.activeEditor?.file?.path
		var folgeTokens = getFolgeTokens(folgeIdentifier)
		// console.log(folgeTokens)

		var files = this.app.vault.getMarkdownFiles();
		var parent = undefined
		let siblings: Array<string> = [];
		let children: Array<string> = [];
		// console.log(files)
		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			// console.log("Considering " + file.name + "...")
			var fileFolgeIdentifier = getFolgeIdentifier(file.name)
			if (!isFolgeFile(fileFolgeIdentifier)) {
				// console.log(file.name + " is not a zettel")
				continue
			}
			var fileFolgeTokens = getFolgeTokens(fileFolgeIdentifier)

			var linkText = file.path
			if (isDirectParent(folgeTokens, fileFolgeTokens)) {
				parent = linkText
			}
			if (isSibling(folgeTokens, fileFolgeTokens)) {
				siblings.push(linkText)
			}
			if (isDirectChild(folgeTokens, fileFolgeTokens)) {
				children.push(linkText)
			}
		}
		return {
			parent: parent,
			siblings: siblings,
			children: children,
			source: source
		}
	}

	async createLink(parent: any, sourcePath: string, filePath: string) {
		let linkContainer = document.createElement("div");

		await MarkdownRenderer.renderMarkdown(`[[${filePath}]]`, linkContainer, sourcePath, parent);
		return linkContainer
	}

	async renderFolgezettels(folgezettels: any) {
		const container = this.containerEl.children[1];
		container.empty();

		if (folgezettels == undefined) {
			container.createEl("h4", { text: "Folgezettel" });
			return
		}
	  	
		var fileName = this.app.workspace.activeEditor?.file?.name
		
		container.createEl("h4", { text: fileName === undefined ? "Folgezettel" : fileName + " Folgezettel" });

		if (folgezettels.parent !== undefined) {
			container.createEl("h5", { text: "👨 Parent: "});
			container.appendChild(await this.createLink(container, folgezettels.source, folgezettels.parent))
		}
		
		if (folgezettels.siblings.length > 0) {
			container.createEl("h5", { text: "🤼 Siblings: "});
		}
		for (var s = folgezettels.siblings.length-1; s >= 0; s--) {
			container.appendChild(await this.createLink(container, folgezettels.source, folgezettels.siblings[s]))
		}
		if (folgezettels.children.length > 0) {
			container.createEl("h5", { text: "👨‍👩‍👦 Children: "});
		}
		for (var s = folgezettels.children.length-1; s >= 0; s--) {
			container.appendChild(await this.createLink(container, folgezettels.source, folgezettels.children[s]))
		}
	}

	async recalc() {
		// console.log("Recalc")
		var folgezettels = this.calculateFolgezettels()
		await this.renderFolgezettels(folgezettels)
	}
  
	async onClose() {
	  // Nothing to clean up.
	}
  }

export default class FolgeRenamingPlugin extends Plugin {
	
	addDivToSizer() {
		let sizer = document.querySelector('#cm-sizer');
		if (!sizer) {
		  return
		}
		let newDiv = document.createElement('div');
		newDiv.innerHTML = 'New div added by plugin';
		sizer.appendChild(newDiv);
	}

	async unload() {
		this.app.workspace.detachLeavesOfType(folgezettelViewType);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(folgezettelViewType);
	
		await this.app.workspace.getRightLeaf(false).setViewState({
		  type: folgezettelViewType,
		  active: true,
		});
	
		this.app.workspace.revealLeaf(
		  this.app.workspace.getLeavesOfType(folgezettelViewType)[0]
		);
	  }

	updateFoglezettelsView() {
		this.app.workspace.getLeavesOfType(folgezettelViewType).forEach((leaf) => {
			if (!(leaf.view instanceof FolgezettelView)) {
			  return
			}
			leaf.view.recalc()
		});
	}

	async onload() {

		this.registerView(
			folgezettelViewType,
			(leaf) => new FolgezettelView(leaf)
		);
		
		this.addRibbonIcon("dice", "Activate view", () => {
			this.activateView();
		});

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				this.addDivToSizer();
				this.updateFoglezettelsView()
			})
		);

		this.registerEvent(this.app.vault.on('rename', async (newFile: any, oldPath: string) => {
			this.addDivToSizer();
			const oldFileName = oldPath.substring(oldPath.lastIndexOf('/')+1, oldPath.length);
			// console.log(oldFileName)
			// console.log(newFile.name)
			var oldFolgeIdentifier = getFolgeIdentifier(oldFileName)
			// console.log(oldFolgeIdentifier)
			if (!isFolgeFile(oldFolgeIdentifier)) {
				// console.log(oldFolgeIdentifier + " is not a zettel id")
				return
			}
		
			var newFolgeIdentifier = getFolgeIdentifier(newFile.name)
			// console.log(newFolgeIdentifier);
			if (!isFolgeFile(newFolgeIdentifier)) {
				// console.log(newFolgeIdentifier + " is not a zettel id")
				return
			}

			var files = this.app.vault.getMarkdownFiles();
			// console.log(files)
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				// console.log("Considering " + file.name + "...")
				var fileFolgeIdentifier = getFolgeIdentifier(file.name)
				if (!isFolgeFile(fileFolgeIdentifier)) {
					// console.log(file.name + " is not a zettel")
					continue
				}
				if (!file.name.startsWith(oldFolgeIdentifier)) {
					// console.log(file.name + " is not a child of " + oldFileName)
					continue
				}
				const newPath = file.path.replace(oldFolgeIdentifier, newFolgeIdentifier);
				// console.log("Replacing " + file.path + " with " + newPath)
				this.app.fileManager.renameFile(file, newPath)
			}

			// this.updateFoglezettelsView()
		}));	
	}
}
