import {TFile} from "obsidian"

export default {
    getFolgeIdentifier, 
    isFolgeFile,
    getFolgeTokens,
    isDirectParent, 
    isSibling,
    isDirectChild,
    getNewPathForFolgezettelWithMovedParent
}

function getFolgeIdentifier (filename: string) {
	const tokens = filename.split(" ")
	return tokens[0]
}

function isFolgeFile (folgeIdentifier: string) {
	return  /^[0-9]+[a-zA-Z]*/.test(folgeIdentifier)
}

function getFolgeTokens(folgeIdentifier: string) {
	let tokens: Array<string> = []
	var currentToken = ""
	var isNumeric = true
	for (var c = 0; c < folgeIdentifier.length; c++) {
		var currentCharacter = folgeIdentifier[c]
		var isNumber = /[0-9]/.test(currentCharacter)
		if (isNumeric == isNumber) {
			currentToken = currentToken + currentCharacter
			continue
		}
		isNumeric = !isNumeric
		tokens.push(currentToken)
		currentToken = currentCharacter
	}
	if (currentToken.length > 0) {
		tokens.push(currentToken)
	}
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
	if (folgeTokens[folgeTokens.length-1] == siblingTokens[folgeTokens.length-1]) {
		// console.log(folgeTokens[folgeTokens.length], siblingTokens[folgeTokens.length])
		return false
	}
	return true
}



function getNewPathForFolgezettelWithMovedParent(oldParentFolge: string, newParentFolge: string, file: TFile) {
    var originalBasename = file.basename
    const oldParentTokens = getFolgeTokens(oldParentFolge)
    const newParentTokens = getFolgeTokens(newParentFolge)
    const originalTokens = getFolgeTokens(getFolgeIdentifier(originalBasename))
	console.log("Old Parent Tokens ", oldParentTokens)
	console.log("New Parent Tokens ", newParentTokens)
	console.log("Old Tokens ", originalTokens)

    const aCharCode = 97
    const zCharCode = 122
    const baseTen = 10

    var isNumeric = true
    var newFolge = newParentFolge

	for (var i = 1; i < newParentTokens.length; i++){
		isNumeric = !isNumeric
	}

	console.log("Start reading at the " + (oldParentTokens.length+1) + " token " + originalTokens[oldParentTokens.length])

    for(var o = oldParentTokens.length; o < originalTokens.length; o++) {
		var token = originalTokens[o]
		console.log("Token " + o + " " + token)
        var isNumber = /[0-9]*/.test(token)

		if (o >= oldParentTokens.length) {
			if (isNumeric && !isNumber) {
				// Convert alpha to number
				var totalNumber = 0
				for (var c = 0 ; c < token.length ; c++) {
					totalNumber = token[c].toLowerCase().charCodeAt(baseTen) - aCharCode
				}
				token = totalNumber.toString()
				console.log("a->n " + originalTokens[o] + " -> " + token)
			}
			else if(!isNumeric && isNumber) {
				// Convert number to alpha
				var newToken = ""
				var tokenNumber = parseInt(token)
				var distanceBetweenZAndA = zCharCode - aCharCode
				var totalZCharacters = tokenNumber % distanceBetweenZAndA
				for(var c = 0; c < totalZCharacters; c++) {
					newToken += "z"
				}
				var remainingChars = tokenNumber - (distanceBetweenZAndA * totalZCharacters)
				if (remainingChars > 0) {
					newToken += String.fromCharCode(remainingChars + aCharCode)
				}
				token = newToken
				console.log("n->a " + originalTokens[o] + " -> " + token)
			}
		}
		else {
			console.log("o->w " + oldParentTokens[o] + " -> " + newParentTokens[o])
			token = newParentTokens[o]
		}
		isNumeric = !isNumeric
		newFolge += token
	}

    var newPath = file.path.replace(oldParentFolge, newParentFolge)
    console.log(file.path, newPath)
	return newPath
}