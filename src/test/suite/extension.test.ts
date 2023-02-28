import * as assert from 'assert'
import { before } from 'mocha'

import * as vscode from 'vscode'
import * as myExtension from '../../extension'

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.')
	})

	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5))
		assert.equal(-1, [1, 2, 3].indexOf(0))
	})
})
