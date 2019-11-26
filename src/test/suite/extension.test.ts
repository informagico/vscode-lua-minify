import * as assert from 'assert'
import { before } from 'mocha'

import * as vscode from 'vscode'
import * as myExtension from '../../extension'

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.')
	})

	test('Sample test', () => {
		assert.equal(-1, [ 1, 2, 3 ].indexOf(5))
		assert.equal(-1, [ 1, 2, 3 ].indexOf(0))
	})

	test('Test if minify works with empty text', () => {
		assert.equal(myExtension.minify(''), '')
	})

	test('Test if minify works with valid Lua code', () => {
		assert.equal(
			myExtension.minify(`function newClass(name, baseClass)
									baseClass = baseClass or Object
									return baseClass:subClass(name)
								end`),
			'function newClass(a,b)b=b or Object;return b:subClass(a)end'
		)
	})

	test('Test if minify throws an error with invalid Lua code', () => {
		assert.throws(
			() => myExtension.minify('this should throw an error'),
			new Error("SyntaxError: [1:0] unexpected identifier 'this' near 'throw'")
		)
	})
})
