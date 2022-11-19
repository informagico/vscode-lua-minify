import * as vscode from 'vscode'
import * as fs from 'fs'
const luamin = require('luamin')
const path = require('path')
const luaformat = require('./luamin.js')

export function activate(context: vscode.ExtensionContext) {
	/**
	 * Minify the whole active document text
	 */
	let minifyLuaFile = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaFile', () => {
		let luaCodeMin: string = ''

		// get full document text
		let luaCode: string | undefined = getText()

		if (!luaCode) {
			vscode.window.showErrorMessage('Unable to get Lua code!')
			return
		}

		try {
			luaCodeMin = minify(luaCode)
		} catch (error) {
			vscode.window.showErrorMessage('' + error)
			return
		}

		// replace file content
		editFileText(false, luaCodeMin)
	})

	context.subscriptions.push(minifyLuaFile)

	// /**
	//  * Minify the selected document text
	//  */
	let minifyLuaSelection = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaSelection', () => {
		let luaCodeMin: string = ''

		let luaCode: string | undefined = getText(true)

		if (!luaCode) {
			vscode.window.showErrorMessage('Unable to get Lua code!')
			return
		}

		try {
			luaCodeMin = minify(luaCode)
		} catch (error) {
			vscode.window.showErrorMessage('' + error)
			return
		}

		// replace file content
		editFileText(true, luaCodeMin)
	})

	context.subscriptions.push(minifyLuaSelection)

	/**
	 * Create a minified version (.min) of the Lua code file
	 */
	let createMinifiedFile = vscode.commands.registerCommand('vscode-lua-minify.createMinifiedFile', () => {
		let luaCodeMin: string = ''

		let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

		if (!editor) {
			return
		}

		if (!isActiveDocumentFile()) {
			vscode.window.showWarningMessage('You need to save the file first!')
			return
		}

		// save document
		editor.document.save()

		// get lua code
		let luaCode: string | undefined = getText()

		if (!luaCode) {
			vscode.window.showErrorMessage('Unable to get Lua code!')
			return
		}

		// minify the code
		try {
			luaCodeMin = minify(luaCode)
		} catch (error) {
			vscode.window.showErrorMessage('' + error)
			return
		}

		// generate new minified file name
		let newFilePath: string | undefined = getNewMinFilePath()

		if (!newFilePath) {
			vscode.window.showErrorMessage('Unable to create the minified file!')
			return
		}

		// save the new file
		fs.writeFileSync(newFilePath, luaCodeMin, 'utf8')

		// open the newly created file in the editor
		var openPath = vscode.Uri.file(newFilePath)
		vscode.workspace.openTextDocument(openPath).then((doc) => {
			vscode.window.showTextDocument(doc)
		})
	})

	context.subscriptions.push(createMinifiedFile)
}

export function deactivate() { }

/**
 * Tries to return minified version of given Lua code
 *
 * @export
 * @param {string} luaCode Code to minify
 * @returns {string} Minified code
 */
export function minify(code: string): string {
	let luaCodeMin: string = ''

	var flavour = vscode.workspace.getConfiguration('vscode-lua-minify').get('flavour', 'luamin')

	switch (flavour) {
		case "lua-format":
			var renameVariables = vscode.workspace.getConfiguration('vscode-lua-minify').get('renameVariables', false)
			var renameGlobals = vscode.workspace.getConfiguration('vscode-lua-minify').get('renameGlobals', false)
			var solveMath = vscode.workspace.getConfiguration('vscode-lua-minify').get('solveMath', false)

			const settings = {
				RenameVariables: renameVariables,
				RenameGlobals: renameGlobals,
				SolveMath: solveMath
			}

			luaCodeMin = luaformat.Minify(code, settings)
			luaCodeMin = luaCodeMin.replace("--discord.gg/boronide, code generated using luamin.js™\n\n\n\n", "")
			break;

		default:
			luaCodeMin = luamin.minify(code)
			break;
	}

	return luaCodeMin
}

/**
 * Returns the requested document text
 *
 * @export
 * @param {boolean} [selection=false] Defines if you want the selection or whole text
 * @returns {(string | undefined)}
 */
function getText(selection: boolean = false): string | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	if (selection) {
		return editor.document.getText(getRange(true))
	} else {
		return editor.document.getText()
	}
}

/**
 * Returns the requested document text Range
 *
 * @export
 * @param {boolean} [selection=false] Defines if you want the selection or whole text range
 * @returns {(vscode.Range | undefined)}
 */
function getRange(selection: boolean = false): vscode.Range | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	if (selection) {
		return new vscode.Range(editor.selection.start, editor.selection.end)
	} else {
		let luaCode: string | undefined = getText(false)

		if (!luaCode) {
			return undefined
		}

		return new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(luaCode.length))
	}
}

/**
 * Returns if the current open document file exists or it is still unsaved
 *
 * @export
 * @returns {boolean}
 */
function isActiveDocumentFile(): boolean | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	return fs.existsSync(editor.document.fileName)
}

/**
 * Edit the current opened file with given text
 *
 * @export
 * @param {boolean} selection
 * @param {string} text
 */
function editFileText(selection: boolean, text: string) {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
	let range = getRange(selection)

	if (!editor || !range) {
		throw new Error('Unable to edit the file!')
	}

	editor.edit((editBuilder: vscode.TextEditorEdit) => {
		editBuilder.replace(range as vscode.Range, text)
	})
}

/**
 * Returns the new minified file name
 *
 * @export
 * @returns {string}
 */
function getNewMinFilePath(): string | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	return path.format({
		dir: path.dirname(editor.document.fileName),
		name: path.parse(editor.document.fileName).name,
		ext: '.min' + path.extname(editor.document.fileName),
	})
}
