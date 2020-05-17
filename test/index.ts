import debug from 'debug';

import {expect} from 'chai';
import {Tree} from '../src/index';

const log = debug('ravl:test');

describe("Tree", function() {
    it('constructs', function() {
        expect(function() {
            new Tree<string>();
        }).to.not.throw();
    });
    it("can tell you its size", function() {
        let tree = new Tree<string>();
        expect(tree.size).to.be.a('number');
        expect(tree.size).to.equal(0);
    });
    it("can add items", function() {
        let tree = new Tree<string>();
        expect(function() {
            tree.add('1')
        }).to.not.throw();
        expect(tree.add('1').size).to.equal(1);
    });
    it("can retrieve items", function() {
        let tree = new Tree<string>().add('1');
        expect(function() {
            tree.find('1')
        }).to.not.throw()
        expect(tree.find('1')).to.equal('1');
    });
    it("can remove items", function() {
        let tree = new Tree<string>();
        tree = tree.add('1').add('2');
        expect(function() {
            tree = tree.remove('1');
        }).to.not.throw();
        expect(tree.remove('1').size).to.equal(0);
    })
    it("returns a new tree when making changes", function() {
        let tree = new Tree<string>();

        expect(tree.add('1')).to.be.an.instanceOf(Tree);
    });
})
