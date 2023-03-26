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
	// console.log(folgeIdentifier, "-->", tokens)
	return tokens
}

function convertFolgeTokensIntoNumbers(folgeTokens: string[]) {
	var numbers = new Array<number>
	var isNumeric = true
	for(var f = 0; f < folgeTokens.length; f++) {
		if (isNumeric) {
			numbers.push(parseInt(folgeTokens[f]))
		} 
		else {
			numbers.push(convertAlphasToNumber(folgeTokens[f]))
		}
		isNumeric = !isNumeric
	}
	// console.log(folgeTokens, "-->", numbers)
	return numbers
}

function convertAlphasToNumber(alphas: string) {
	const aCharCode = 97

	var total = 0
	for(var a = 0; a < alphas.length; a++) {
		var lowercaseAlphas = alphas[a].toLowerCase()
		var charcode = lowercaseAlphas.charCodeAt(0)
		var aMovedCharcode = charcode - aCharCode
		total += aMovedCharcode
	}
	total += alphas.length - 1
	return total
}

function convertNumberToAlphas(number: number) {
	const aCharCode = 97
	const zCharCode = 122
	const distanceBetweenZAndA = (zCharCode - aCharCode+1)
	
	var alphas = ""
	var totalZCharacters = Math.floor(number / distanceBetweenZAndA)
	for(var c = 0; c < totalZCharacters; c++) {
		alphas += "z"
	}
	var remainingChars = number % distanceBetweenZAndA

	if (remainingChars >= 0) {
		alphas += String.fromCharCode(remainingChars + aCharCode)
	}
	// console.log(number,"-->", alphas, remainingChars)

	return alphas
}

function convertFolgeNumbersIntoFolgeIdentifier(folgeNumbers: number[]) {
	var isNumeric = true
	var identifier = ""
	for (var n = 0; n < folgeNumbers.length; n++) {
		identifier += isNumeric ? folgeNumbers[n].toString() : convertNumberToAlphas(folgeNumbers[n])
		isNumeric = !isNumeric
	}
	// console.log(folgeNumbers, "-->", identifier)
	return identifier
}

function isDirectParent(folgeTokens: string[], suspectedParentTokens: string[]) {
	if (folgeTokens.length - suspectedParentTokens.length !== 1) {
		return false
	}
	for (var i = 0; i < suspectedParentTokens.length ; i++) {
		if (folgeTokens[i].toLowerCase() != suspectedParentTokens[i].toLowerCase()) {
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
		if (folgeTokens[i].toLowerCase() != suspectedChild[i].toLowerCase()) {
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
		if (folgeTokens[i].toLowerCase() != siblingTokens[i].toLowerCase()) {
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
	const oldParentNumberTokens = convertFolgeTokensIntoNumbers(oldParentTokens)
    const newParentTokens = getFolgeTokens(newParentFolge)
	const newParentNumberTokens = convertFolgeTokensIntoNumbers(newParentTokens)
	const originalFolge = getFolgeIdentifier(originalBasename)
    const originalTokens = getFolgeTokens(originalFolge)
    const originalNumberTokens = convertFolgeTokensIntoNumbers(originalTokens)
	// console.log("Old Parent Tokens ", oldParentNumberTokens)
	// console.log("New Parent Tokens ", newParentNumberTokens)
	// console.log("Original Tokens ", originalNumberTokens)

	var newNumberTokens = new Array<number>

	// console.log("Start reading at the " + (oldParentTokens.length+1) + " token " + originalTokens[oldParentTokens.length])

    for(var i = 0; i < newParentNumberTokens.length; i++) {
		newNumberTokens.push(newParentNumberTokens[i])
	}

    for(var o = oldParentNumberTokens.length; o < originalNumberTokens.length; o++) {
		newNumberTokens.push(originalNumberTokens[o])
	}
	// console.log("New Tokens ", newNumberTokens)
	var newFolge = convertFolgeNumbersIntoFolgeIdentifier(newNumberTokens)
    var newPath = file.path.replace(originalFolge, newFolge)
    // console.log(file.path, newPath)
	return newPath
}