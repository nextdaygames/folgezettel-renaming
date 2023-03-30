import { TFile, Plugin } from 'obsidian';

import folgezettelUtilities from "src/folgezettelUtilities"
import FolgezettelView from 'src/folgezettelView';
import indentClasses from 'src/folgezettelIndentClasses';
import colorClasses from 'src/folgezettelColorClasses';

// Renaming a file to be a child of itself breaks the plugin

export default class FolgeRenamingPlugin extends Plugin {

	async unload() {
		this.app.workspace.detachLeavesOfType(FolgezettelView.folgezettelViewType);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(FolgezettelView.folgezettelViewType);
	
		await this.app.workspace.getRightLeaf(false).setViewState({
		  type: FolgezettelView.folgezettelViewType,
		  active: true,
		});
	
		this.app.workspace.revealLeaf(
		  this.app.workspace.getLeavesOfType(FolgezettelView.folgezettelViewType)[0]
		);
	  }

	async fixFileFolge(file:Element) {

	}

	async fixNumbering() {
		const fileExplorer = document.querySelector('.nav-folder-children');
		if (fileExplorer == null) {
			return
		}
		const files = fileExplorer.querySelectorAll('.nav-file');
		files.forEach(this.fixFileFolge);
	}

	updateFoglezettelsView() {
		this.app.workspace.getLeavesOfType(FolgezettelView.folgezettelViewType).forEach((leaf) => {
			if (!(leaf.view instanceof FolgezettelView)) {
			  return
			}
			leaf.view.recalc()
		});
	}

	attemptIndentFile(file: Element) {
		var titleContentDiv = file.querySelector('.nav-file-title')
		if (titleContentDiv == null) {
			return
		}
		var titleDiv = titleContentDiv.querySelector('.nav-file-title-content')
		if (titleDiv == null) {
			return
		}
		var fileFolgeIdentifier = folgezettelUtilities.getFolgeIdentifier(titleDiv.innerHTML)
		if (!folgezettelUtilities.isFolgeFile(fileFolgeIdentifier)) {
			return
		}
		var folgeTokens = folgezettelUtilities.getFolgeTokens(fileFolgeIdentifier)
		
		const classIndex = indentClasses[folgeTokens.length] != undefined ? folgeTokens.length : folgeTokens.length - 1
		titleDiv.removeClasses(colorClasses)
		titleDiv.addClass(colorClasses[classIndex])
		file.removeClasses(indentClasses)
		file.addClass(indentClasses[classIndex])
	}

	checkFoldersForIndent(element: Element) {
		const files = element.querySelectorAll('.nav-file');
		files.forEach(this.attemptIndentFile);

		const folders = element.querySelectorAll('.nav-folder');
		folders.forEach((folderElement) => { this.checkFoldersForIndent(folderElement) })
	}

	indentFiles() {
		const fileExplorer = document.querySelector('.nav-folder-children');
		if (fileExplorer == null) {
			return
		}
		this.checkFoldersForIndent(fileExplorer)
	}

	attemptUpdateFolgeFilesForRename(newFile: TFile, oldPath: string) {
		const oldFileName = oldPath.substring(oldPath.lastIndexOf('/')+1, oldPath.length);
			
		var oldFolgeIdentifier = folgezettelUtilities.getFolgeIdentifier(oldFileName)
		if (!folgezettelUtilities.isFolgeFile(oldFolgeIdentifier)) {
			return
		}
	
		var newFolgeIdentifier = folgezettelUtilities.getFolgeIdentifier(newFile.basename)
		if (!folgezettelUtilities.isFolgeFile(newFolgeIdentifier)) {
			return
		}

		if (oldFolgeIdentifier == newFolgeIdentifier) {
			// We do not both with moves via folders, move everything if you must
			return
		} 

		var files = this.app.vault.getMarkdownFiles();
		files.forEach(file => {
			this.updateFile(file, oldFolgeIdentifier, newFolgeIdentifier)
		});
	}

	updateFile(file: TFile, oldParentFolgeIdentifier: string, newParentFolgeIdentifier: string){
		var fileFolgeIdentifier = folgezettelUtilities.getFolgeIdentifier(file.basename)
		if (!folgezettelUtilities.isFolgeFile(fileFolgeIdentifier)) {
			return
		}

		var oldParentFolgeTokens = folgezettelUtilities.getFolgeTokens(oldParentFolgeIdentifier)
		var fileFolgeTokens = folgezettelUtilities.getFolgeTokens(fileFolgeIdentifier)
		if (!folgezettelUtilities.isDirectParent(fileFolgeTokens, oldParentFolgeTokens)) {
			// This isn't a parent of mine
			return
		}

		const newPath = folgezettelUtilities.getNewPathForFolgezettelWithMovedParent(oldParentFolgeIdentifier, newParentFolgeIdentifier, file)
		this.app.fileManager.renameFile(file, newPath)
	}

	async onload() {
		console.log("Loading Folgezettel Renaming Plugin")
		this.registerView(
			FolgezettelView.folgezettelViewType,
			(leaf) => new FolgezettelView(leaf)
		);
		
		this.addRibbonIcon("dice", "Activate view", () => {
			this.activateView();
		});

		this.addRibbonIcon("dice", "Fix Folge", () => {
			this.fixNumbering();
		});

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				this.updateFoglezettelsView()
				this.indentFiles()
			})
		);

		this.registerEvent(this.app.vault.on('rename', async (newFile: any, oldPath: string) => {
			this.attemptUpdateFolgeFilesForRename(newFile, oldPath)
		}));	
	}
}


