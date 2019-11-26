import * as vscode from 'vscode'
const luamin = require('luamin')

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.minifyLuaCode', () => {
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
		editor.document.save()
	})

	context.subscriptions.push(disposable)
}

export function deactivate() {}

export function minify(luaCode: string): {} {
	// minify the code
	try {
		return luamin.minify(luaCode)
	} catch (error) {
		throw new Error(error)
	}
}

export function getFullRange(luaCode: string): vscode.Range | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor) {
		return new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(luaCode.length))
	}

	return undefined
}
