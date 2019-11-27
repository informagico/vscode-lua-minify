import * as vscode from 'vscode'
const luamin = require('luamin')

export function activate(context: vscode.ExtensionContext) {
	/**
	 * Minify the whole active document text
	 */
	let minifyLuaFile = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaFile', () => {
		let luaCodeMin: string = ''

		let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

		if (!editor) {
			return
		}

		let luaCode: string = editor.document.getText()

		try {
			luaCodeMin = luamin.minify(luaCode)
		} catch (error) {
			vscode.window.showErrorMessage('' + error)
			return
		}

		// get document full range
		let fullRange: vscode.Range | undefined = getFullRange(luaCode)

		if (!fullRange) {
			return
		}

		// replace file content
		editor.edit((editBuilder: vscode.TextEditorEdit) => {
			editBuilder.replace(fullRange as vscode.Range, luaCodeMin)
		})

		// save the file
		// editor.document.save()
	})

	context.subscriptions.push(minifyLuaFile)

	// /**
	//  * Minify the selected document text
	//  */
	let minifyLuaSelection = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaSelection', () => {
		let luaCodeMin: string = ''

		let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

		if (!editor) {
			return
		}

		let luaCode: string = editor.document.getText(getSelectionRange())

		try {
			luaCodeMin = luamin.minify(luaCode)
		} catch (error) {
			vscode.window.showErrorMessage('' + error)
			return
		}

		// get document selection range
		let selectionRange: vscode.Range | undefined = getSelectionRange()

		// replace file content
		editor.edit((editBuilder: vscode.TextEditorEdit) => {
			editBuilder.replace(selectionRange as vscode.Range, luaCodeMin)
		})
	})

	context.subscriptions.push(minifyLuaSelection)
}

export function deactivate() {}

/**
 * Tries to return minified version of given Lua code
 *
 * @export
 * @param {string} luaCode Code to minify
 * @returns {string} Minified code
 */
export function minify(luaCode: string): string {
	// minify the code
	try {
		return luamin.minify(luaCode)
	} catch (error) {
		throw new Error(error)
	}
}

/**
 * Returns the selection Range object
 *
 * @export
 * @returns {(vscode.Range | undefined)}
 */
export function getSelectionRange(): vscode.Range | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor) {
		return new vscode.Range(editor.selection.start, editor.selection.end)
	}

	return undefined
}

/**
 * Returns the whole document range by given content
 *
 * @export
 * @param {string} luaCode The Lua code of the whole document
 * @returns {(vscode.Range | undefined)}
 */
export function getFullRange(luaCode: string): vscode.Range | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor) {
		return new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(luaCode.length))
	}

	return undefined
}
