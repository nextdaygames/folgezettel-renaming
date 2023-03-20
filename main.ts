import { Plugin } from 'obsidian';

async function getFolgeIdentifier (filename: string) {
	const tokens = filename.split(" ")
	return tokens[0]
}

async function isFolgeFile (folgeIdentifier: string) {
	return  /^[0-9]+[a-zA-Z]*/.test(folgeIdentifier)
}

export default class FolgeRenamingPlugin extends Plugin {
	async onload() {
		this.registerEvent(this.app.vault.on('rename', async (newFile: any, oldPath: string) => {
			const oldFileName = oldPath.substring(oldPath.lastIndexOf('/')+1, oldPath.length);
			// console.log(oldFileName)
			// console.log(newFile.name)
			var oldFolgeIdentifier = await getFolgeIdentifier(oldFileName)
			// console.log(oldFolgeIdentifier)
			if (!await isFolgeFile(oldFolgeIdentifier)) {
				// console.log(oldFolgeIdentifier + " is not a zettel id")
				return
			}
		
			var newFolgeIdentifier = await getFolgeIdentifier(newFile.name)
			// console.log(newFolgeIdentifier);
			if (!await isFolgeFile(newFolgeIdentifier)) {
				// console.log(newFolgeIdentifier + " is not a zettel id")
				return
			}

			var files = this.app.vault.getMarkdownFiles();
			// console.log(files)
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				// console.log("Considering " + file.name + "...")
				var fileFolgeIdentifier = await getFolgeIdentifier(file.name)
				if (!await isFolgeFile(fileFolgeIdentifier)) {
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
		}));	
	}
}
