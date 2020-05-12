import debug from 'debug';

const log = debug('ravl');

const enum TreeFields {
    SIZE,
    OPTIONS,
    ROOT,
}

const enum NodeFields {
    VALUE,
    BALANCE,
    LEFT,
    RIGHT
}

export type AVLNode = [number, any, AVLNode, AVLNode];
export type AVLTree = [number, AVLOptions, AVLNode];
export type AVLComparator = (a: any, b: any) => number;
export type AVLOptions = {
    compare: AVLComparator,
};

export function defaultCompare(a: any, b: any) {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
}

export const defaultOptions = {
    compare: defaultCompare,
};

export function tree(options?: AVLOptions): AVLTree {
    if (!options) {
        options = defaultOptions;
    }

    return [0, options, null];
}

export function size(tree: AVLTree) {
    return tree[TreeFields.SIZE];
}

export function contains([size, options, root]: AVLTree, value: any) {
    let { compare } = options;
    return nodeContains(compare, value, root);
}

function nodeContains(compare: AVLComparator, value: any, it: AVLNode) {
    if (it === null) return false;

    while (it) {
        let comparison = compare(value, getValue(it));
        if (comparison === 0) return getValue(it);
        else if (comparison < 0) it = getLeft(it);
        else it = getRight(it);
    }

    return false;
}

function node(value: any, balance = 0, left: AVLNode = null, right: AVLNode = null): AVLNode {
    return [value, balance, left, right];
}

export function insert(tree: AVLTree, insertValue: any) {
    if (tree[TreeFields.ROOT] === null) {
        tree[TreeFields.SIZE] += 1;
        tree[TreeFields.ROOT] = node(insertValue);
        return tree;
    }

    let stack: [number, AVLNode][] = [];
    let comparison: number = 0;
    let it: AVLNode = tree[TreeFields.ROOT];

    const { compare } = tree[TreeFields.OPTIONS];

    while (it != null) {
        let [currentValue, balance, left, right] = it;
        let comparison = compare(insertValue, currentValue);

        if (comparison === 0) {
            // Value already exists; don't insert
            return tree;
        } else {
            stack.unshift([comparison, it]);
            if (comparison < 0) {
                it = left;
            }
            if (comparison > 0) {
                it = right;
            }
        }
    }

    let newNode = node(insertValue, 0, null, null);
    let balanced = false;

    while (stack.length > 0) {
        [comparison, it] = stack.shift();
        //let [value, balance, left, right] = it;


        if (comparison < 0) {
            newNode = setLeft(it, newNode);
            if (!balanced) newNode = decrementBalance(newNode);
        } else {
            newNode = setRight(it, newNode);
            if (!balanced) incrementBalance(newNode)
        }

        const balance = getBalance(newNode);
        if (balance === 0) {
            balanced = true;
        }

        if (balanced) {
            continue;
        }

        if (balance < -1) {
            // We're left heavy
            if (getBalance(getLeft(newNode)) === 1)
                newNode = setLeft(newNode, rotateLeft(getLeft(newNode)));
            newNode = rotateRight(newNode);
            balanced = true;
        } else if (balance > 1) {
            // We're right heavy
            if (getBalance(getRight(newNode)) === -1)
                newNode = setRight(newNode, rotateRight(getRight(newNode)));
            newNode = rotateLeft(newNode);
            balanced = true;
        }
    }

    tree[TreeFields.SIZE] += 1;
    tree[TreeFields.ROOT] = newNode;
    return tree;
}

function getValue(node: AVLNode) {
    return node[NodeFields.VALUE];
}

function getBalance(node: AVLNode): number {
    if (node === null) return 0;

    return node[NodeFields.BALANCE];
}

function getLeft(node: AVLNode) {
    return node[NodeFields.LEFT];
}

function setLeft(node: AVLNode, left: AVLNode): AVLNode {
    node[NodeFields.LEFT] = left;
    return node;
}

function getRight(node: AVLNode) {
    return node[NodeFields.RIGHT];
}

function setRight(node: AVLNode, right: AVLNode): AVLNode {
    node[NodeFields.RIGHT] = right;
    return node;
}

function rotateRight(node: AVLNode): AVLNode {
    /**
     *     A(-2)
     *    /  
     *   B(-1)
     *  /
     * C(0)
     *
     *    TO
     *
     *    B(0)
     *   / \
     *  A(0)C(0)
     *
     */
    let leftNode = getLeft(node);
    node = setLeft(node, getRight(leftNode))

    node = incrementBalance(node);
    const leftBalance = getBalance(leftNode);
    if (leftBalance < 0)
        node = incrementBalance(node, leftBalance);

    leftNode = incrementBalance(leftNode);
    const balance = getBalance(node);
    if (balance > 0)
        leftNode = decrementBalance(leftNode, balance);

    leftNode = setRight(leftNode, node);

    return leftNode;
}

function rotateLeft(node: AVLNode): AVLNode {
    /**
     *    A(2)
     *     \
     *      B(1)
     *       \
     *        C(0)
     *
     *    TO
     *
     *    B(0)
     *   / \
     *  A(0)C(0)
     *
     */
    let rightNode = getRight(node);
    node = setRight(node, getLeft(rightNode));

    // The parent has rotated left
    node = decrementBalance(node);
    const rightBalance = getBalance(rightNode);
    if (rightBalance > 0) {
        node = decrementBalance(node, rightBalance);
    }

    rightNode = decrementBalance(rightNode);
    const balance = getBalance(node);
    if (balance < 0) {
        // The original parent is right heavy. That's now our left node, which means we need to
        // DECREASE our rightBalance factor by the balance factory, which is positive
        rightNode = decrementBalance(rightNode, balance);
    }

    rightNode = setLeft(rightNode, node);

    return rightNode;
}

function incrementBalance(node: AVLNode, amount: number = 1) {
    node[NodeFields.BALANCE] = node[NodeFields.BALANCE] + amount;
    return node;
}

function decrementBalance(node: AVLNode, amount: number = 1) {
    node[NodeFields.BALANCE] = node[NodeFields.BALANCE] - amount;
    return node;
}


export function print(tree: AVLTree) {
    printNodes(tree[TreeFields.ROOT], 0);
}

function printNodes(node: AVLNode, depth: number) {
    if (node === null) return;

    printNodes(getLeft(node), depth + 1);
    printNode(node, depth);
    printNodes(getRight(node), depth + 1);
}

function printNode(node: AVLNode, depth: number) {
    const indent = '  '.repeat(depth);
    console.log('%s%o', indent, getValue(node));
}
