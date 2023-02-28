import * as fs from 'fs'
import * as vscode from 'vscode'

const luamin = require('luamin')
const path = require('path')
const luaformat = require('./luamin.js')
const jschardet = require('jschardet')

export function activate(context: vscode.ExtensionContext) {
	/**
	 * Minify the whole active document text
	 */
	let minifyLuaFile = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaFile', () => {
		const activeFile = getActiveFileUri();

		if (activeFile === undefined) {
			vscode.window.showErrorMessage('Unable to get Lua code!')
			return
		}

		minifyFileAndSave(activeFile);
	})

	context.subscriptions.push(minifyLuaFile)

	/**
	 * Minify all files in current workspace
	 */
	let minifyLuaWorkspace = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaWorkspace', async () => {
		const files = await getLuaFilesInWorkspace()

		if (files === undefined) {
			vscode.window.showErrorMessage('Unable to get Lua files!')
			return;
		}

		files.map((file) => {
			minifyFileAndSave(file)
		})
	})

	context.subscriptions.push(minifyLuaWorkspace)

	// /**
	//  * Minify the selected document text
	//  */
	let minifyLuaSelection = vscode.commands.registerCommand('vscode-lua-minify.minifyLuaSelection', () => {
		minifySelectedTextAndSave();
	})

	context.subscriptions.push(minifyLuaSelection)

	/**
	 * Create a minified version (.min) of the active Lua code file
	 */
	let createMinifiedFile = vscode.commands.registerCommand('vscode-lua-minify.createMinifiedFile', () => {
		const activeFile = getActiveFileUri();

		if (activeFile === undefined) {
			vscode.window.showErrorMessage('Unable to get Lua code!')
			return
		}

		minifyFileAndSave(activeFile, true)
	})

	context.subscriptions.push(createMinifiedFile)

	/**
	 * Create a minified version (.min) of the Lua code files in current workspace
	 */
	let createMinifiedFileWorkspace = vscode.commands.registerCommand('vscode-lua-minify.createMinifiedFileWorkspace', async () => {
		const files = await getLuaFilesInWorkspace()

		if (files === undefined) {
			vscode.window.showErrorMessage('Unable to get Lua files!')
			return;
		}

		files.map((file) => {
			minifyFileAndSave(file, true)
		})
	})

	context.subscriptions.push(createMinifiedFileWorkspace)
}

export function deactivate() { }

/**
 * Tries to return minified version of given Lua code
 *
 * @export
 * @param {string} luaCode Code to minify
 * @returns {string} Minified code
 */
function minifyCode(code: string): string {
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
 * Minify the whole file or create a .min.lua minified version
 *
 * @param file Uri of the file to minify
 * @param createMinFile Boolean, if true it will create a new file with .min.lua extension
 */
function minifyFileAndSave(file: vscode.Uri | undefined, createMinFile: boolean = false): void {
	if (file === undefined || !fs.existsSync(file.fsPath)) {
		vscode.window.showErrorMessage('Unable to get the file.')
		return
	}

	const fileContent = fs.readFileSync(file.fsPath)
	let encoding = undefined;

	try {
		encoding = jschardet.detect(fileContent)
	}
	catch { }

	let luaCodeMin = ''
	try {
		luaCodeMin = minifyCode(fileContent.toString(encoding ? encoding.encoding : 'utf8'))
	} catch (error) {
		vscode.window.showErrorMessage('' + error)
		return
	}

	if (createMinFile) {
		const newFileName = path.format({ ...path.parse(file.fsPath), base: '', ext: '.min.lua' })
		fs.writeFileSync(newFileName, luaCodeMin)
	}
	else {
		fs.writeFileSync(file.fsPath, luaCodeMin)
	}
}

/**
 * Replace currently selected text with its minified version
 * @returns 
 */
function minifySelectedTextAndSave(): void {
	let selection = getSelectedText()

	if (selection === undefined ||
		selection.editor === undefined ||
		selection.range === undefined ||
		selection.text === undefined) {
		vscode.window.showErrorMessage('Unable to get Lua code!')
		return
	}

	let luaCodeMin = '';

	try {
		luaCodeMin = minifyCode(selection.text)
	} catch (error) {
		vscode.window.showErrorMessage('' + error)
		return
	}

	replaceSelectedText(selection.editor, selection.range, luaCodeMin)
}

/**
 * Returns the active document Uri
 *
 * @returns {(Uri | undefined)}
 */
function getActiveFileUri(): vscode.Uri | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	return editor.document.uri
}

async function getLuaFilesInWorkspace(): Promise<vscode.Uri[] | undefined> {
	var exludeGlobs = vscode.workspace.getConfiguration('vscode-lua-minify').get('excludeGlobs', []) as string[]
	exludeGlobs.push('*.min.lua')

	try {
		return await vscode.workspace.findFiles('**/', `**/{${exludeGlobs.join()}}`)
	}
	catch {
		return undefined
	}
}

/**
 * Returns the requested document text
 *
 * @export
 * @returns {(string | undefined)}
 */
function getSelectedText(): { range: vscode.Range | undefined, editor: vscode.TextEditor, text: string | undefined } | undefined {
	const result = getSelectedRange()

	if (result === undefined) {
		vscode.window.showErrorMessage('Unable to get selected text range!')
		return undefined
	}

	return {
		editor: result.editor,
		range: result.range,
		text: result.editor.document.getText(result.range)
	}
}

/**
 * Returns the requested document text Range
 *
 * @returns {(vscode.Range | undefined)}
* @returns {(vscode.TextEditor | undefined)}
 */
function getSelectedRange(): { range: vscode.Range | undefined, editor: vscode.TextEditor } | undefined {
	let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (!editor) {
		return undefined
	}

	return {
		range: new vscode.Range(editor.selection.start, editor.selection.end),
		editor: editor
	}
}

/**
 * Replace current selection with new text
 * @param editor Currently active file editor
 * @param range Selected range
 * @param text Text to replace
 */
function replaceSelectedText(editor: vscode.TextEditor, range: vscode.Range, text: string) {
	editor.edit((editBuilder: vscode.TextEditorEdit) => {
		editBuilder.replace(range as vscode.Range, text)
	})
}
