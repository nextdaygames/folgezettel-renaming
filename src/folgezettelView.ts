import { Notice, getLinkpath, MarkdownRenderer, ItemView, WorkspaceLeaf } from 'obsidian';

import folgezettelUtilities from './folgezettelUtilities';

export default class FolgezettelView extends ItemView {
    static folgezettelViewType = "folgezettel-view"
    constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
  
	getViewType() {
	  return FolgezettelView.folgezettelViewType
	}
  
	getDisplayText() {
		return "Folgezettel View"
	}
  
	async onOpen() {
		var folgezettels = this.calculateFolgezettels()
		this.renderFolgezettels(folgezettels)
	}

	calculateFolgezettels() {
		
		var fileName = this.app.workspace.activeEditor?.file?.basename
		if (fileName === undefined) {
			return undefined
		}
		var folgeIdentifier = folgezettelUtilities.getFolgeIdentifier(fileName)
		if (!folgezettelUtilities.isFolgeFile(folgeIdentifier)) {
			return undefined
		}
		var source = this.app.workspace.activeEditor?.file?.path
		var folgeTokens = folgezettelUtilities.getFolgeTokens(folgeIdentifier)

		var files = this.app.vault.getMarkdownFiles();
		var parent = undefined
		let siblings: Array<string> = [];
		let children: Array<string> = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			var fileFolgeIdentifier = folgezettelUtilities.getFolgeIdentifier(file.basename)
			if (!folgezettelUtilities.isFolgeFile(fileFolgeIdentifier)) {
				continue
			}
			var fileFolgeTokens = folgezettelUtilities.getFolgeTokens(fileFolgeIdentifier)

			var linkText = file.path
			if (folgezettelUtilities.isDirectParent(folgeTokens, fileFolgeTokens)) {
				parent = linkText
			}
			if (folgezettelUtilities.isSibling(folgeTokens, fileFolgeTokens)) {
				siblings.push(linkText)
			}
			if (folgezettelUtilities.isDirectChild(folgeTokens, fileFolgeTokens)) {
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
		var linkpath = getLinkpath(filePath)
		var tfile = this.app.metadataCache.getFirstLinkpathDest(linkpath, filePath)
		if (tfile == null) {
			return linkContainer
		}
		
		await MarkdownRenderer.renderMarkdown(`[[${tfile.basename}]]`, linkContainer, sourcePath, parent);
		linkContainer.childNodes[0].addEventListener("click", async () => {
			try {
				if (tfile == null) { return }
				await this.app.workspace.openLinkText(tfile.name, filePath);
			} 
			catch (error) {
				new Notice(`Failed to open file ${filePath}: ${error}`);
			}
		});
		

		return linkContainer
	}

	async renderFolgezettels(folgezettels: any) {
		const container = this.containerEl.children[1];
		container.empty();

		if (folgezettels == undefined) {
			container.createEl("h4", { text: "Folgezettel" });
			return
		}
	  	
		var fileName = this.app.workspace.activeEditor?.file?.basename
		
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
		var folgezettels = this.calculateFolgezettels()
		await this.renderFolgezettels(folgezettels)
	}
  
	async onClose() {
	  // Nothing to clean up.
	}
  }