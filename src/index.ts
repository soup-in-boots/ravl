import debug from 'debug';

const log = debug('ravl');

export type Comparator<T> = (a: T, b: T) => number;
export type Options<T> = {
    compare: Comparator<T>;
};

export function defaultCompare(a: any, b: any) {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
}

export class Tree<T> {
    static defaultOptions = {
        compare: defaultCompare,
    };

    size: number;
    options: Options<T>;
    root: Node<T>;

    constructor({
        options = Tree.defaultOptions,
        root = null,
        size = 0,
    }: Partial<Tree<T>> = {}) {
        if (!options) {
            options = Tree.defaultOptions;
        }

        this.size = size;
        this.root = root;
        this.options = options;
    }

    find(value: any) {
        let { compare } = this.options;
        return this.root.find(compare, value);
    }

    has(value: any) {
        return !!this.find(value);
    }

    add(value: any): Tree<T> {
        if (this.size === 0) {
            const size = this.size + 1;
            const root = new Node({ value });
            return new Tree<T>({ ...this, size, root });
        }

        const { compare } = this.options;

        let stack: [number, Node<T>][] = [];
        let comparison: number = 0;
        let it: Node<T> = this.root;

        while (it) {
            let comparison = compare(value, it.value);

            if (comparison === 0) {
                // Value already exists; don't insert
                return this;
            } else {
                stack.unshift([comparison, it]);

                if (comparison < 0) {
                    it = it.left;
                } else if (comparison > 0) {
                    it = it.right;
                }
            }
        }

        let newNode = new Node<T>({ value });
        let balanced = false;

        while (stack.length > 0) {
            [comparison, it] = stack.shift();

            if (comparison < 0) {
                const left = newNode;
                let balanceFactor = it.balanceFactor;
                if (!balanced) balanceFactor -= 1;
                newNode = new Node<T>({ ...it, left, balanceFactor });
            } else {
                const right = newNode;
                let balanceFactor = it.balanceFactor;
                if (!balanced) balanceFactor += 1;
                newNode = new Node<T>({ ...it, right, balanceFactor });
            }

            if (newNode.balanceFactor === 0) 
                balanced = true;
            

            if (!balanced)
                [newNode, balanced] = newNode.balance();
        }

        const size = this.size + 1;
        const root = newNode;

        return new Tree({ ...this, size, root });
    }

    take(value: T): [T, Tree<T>] {
        if (!this.root) return [undefined, this];

        const { compare } = this.options;

        let stack: Array<[number, Node<T>]> = [];
        let it = this.root;
        let comparison = 0;

        while (it) {
            let comparison = compare(value, it.value);

            if (comparison === 0) {
                break;
            } else {
                stack.unshift([comparison, it]);

                if (comparison < 0) {
                    it = it.left;
                } else if (comparison > 0) {
                    it = it.right;
                }
            }
        }

        // If it's null we didn't find the element
        if (!it) return [undefined, this];
        let taken = it;

        log('take() : taken : %o', taken);

        if (it.left && it.right) {
            if (it.balanceFactor > 0) {
                // Right heavy, so take from the right side
                let [value, left] = it.right.shift();
                log('take() : it.right.shift() : left.balanceFactor : %d', left.balanceFactor);
                log('take() : it.right.shift() : it.right.right.balanceFactor : %d', it.right.right.balanceFactor);
                let balanceFactor = it.right.balanceFactor + 1;
                it = new Node({value, balanceFactor, right: it.right.right, left});
            } else {
                let [value, right] = it.left.pop();
                let balanceFactor = it.left.balanceFactor + 1;
                log('take() : it.left.shift() : it.left.left.balanceFactor : %d', it.left.left.balanceFactor);
                log('take() : it.left.shift() : right.balanceFactor : %d', right.balanceFactor);
                it = new Node({value, balanceFactor, left: it.left.left, right});
            }
        } else if (it.left) {
            log('take() : it.left : %o', it.left);
            it = it.left;
        } else if (it.right) {
            log('take() : it.right : %o', it.right);
            it = it.right;
        } else {
            it = null;
        }

        let previous = null
        let balanced = false;
        while (stack.length > 0) {
            previous = it;
            [comparison, it] = stack.shift()

            if (comparison < 0) {
                let balanceFactor = it.balanceFactor;
                if (!balanced) {
                    balanceFactor +=  1;
                }
                it = new Node({...it, balanceFactor, left: previous});
            } else {
                let balanceFactor = it.balanceFactor;
                if (!balanced) {
                    balanceFactor -=  1;
                }
                it = new Node({...it, balanceFactor, right: previous});
            }

            log('take() : rebuild : pre-balance : %o', it);

            if (!balanced)
                [it, balanced] = it.balance();

            log('take() : rebuild : post-balance key: value %o', it);
            if (it.balanceFactor === 1 || it.balanceFactor === -1) {
                balanced = true;
            }
        }

        let size = this.size - 1;
        let root = it;
        return [taken.value, new Tree({...this, size, root})];
    }

    remove(value: T) {
        const [, tree] = this.take(value);
        return tree;
    }

    print() {
        this.root.print();
    }
}

export class Node<T> {
    value: any;
    balanceFactor: number;
    left: Node<T>;
    right: Node<T>;

    constructor({
        value = null,
        balanceFactor = 0,
        left = null,
        right = null,
    }: Partial<Node<T>> = {}) {
        this.value = value;
        this.balanceFactor = balanceFactor;
        this.left = left;
        this.right = right;
    }

    find(compare: Comparator<T>, value: any) {
        let it: Node<T> = this;

        while (it) {
            let comparison = compare(value, it.value);
            if (comparison === 0) return it.value;
            else if (comparison < 0) it = it.left;
            else it = it.right;
        }

        return false;
    }

    rotateRight(): Node<T> {
        log('rotateRight(%o)', this);
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
        let right = null;
        let root = null;

        {
            /**
             * Recompute the balance for the previous root node;
             * export the new right node. Complete the rotation by
             * taking on the right side of the new left as our left.
             */
            let left = this.left.right;

            let balanceFactor = this.balanceFactor + 1;
            if (this.left.balanceFactor < 0) {
                balanceFactor -= this.left.balanceFactor;
            }

            right = new Node<T>({ ...this, left, balanceFactor });
        }

        {
            /**
             * Recompute the balance for the new root node;
             * export the new root node. Use the previously exported
             * new right node as our right.
             */
            let balanceFactor = this.left.balanceFactor + 1;
            if (right.balanceFactor > 0) balanceFactor -= right.balanceFactor;
            root = new Node<T>({ ...this.left, balanceFactor, right });
        }

        return root;
    }

    rotateLeft(): Node<T> {
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
        let left = null;
        let root = null;

        {
            const right = this.right.left;
            let balanceFactor = this.balanceFactor - 1;
            if (this.right.balanceFactor > 0) balanceFactor -= this.right.balanceFactor;
            left = new Node<T>({ ...this, balanceFactor, right });
            log('rotateLeft() : left : %o', left);
        }

        {
            let balanceFactor = this.right.balanceFactor - 1;
            if (left.balanceFactor < 0) balanceFactor -= left.balanceFactor;
            root = new Node<T>({ ...this.right, balanceFactor, left });
            log('rotateLeft() : root : %o', root);
        }

        return root;
    }

    shift() {
        let it: Node<T> = this;
        let stack: Array<Node<T>> = [];

        while (it.left) {
            stack.push(it);
            it = it.left;
        }

        let popped = it;

        if (it.right) {
            it = it.right;
        } else {
            it = null;
        }

        let previous = null;
        let balanced = false;
        while (stack.length > 0) {
            previous = it;
            it = stack.pop();

            let balanceFactor = it.balanceFactor;
            if (!balanced) balanceFactor += 1;
            if (balanceFactor === 0) balanced = true;
            it = new Node({...it, balanceFactor, left: previous});
            [it, balanced] = it.balance();
        }

        return [popped.value, it];
    }

    pop() {
        let it: Node<T> = this;
        let stack: Array<Node<T>> = [];

        while (it.right) {
            stack.push(it);
            it = it.right;
        }

        let popped = it;

        if (it.left) {
            it = it.left;
        } else {
            it = null;
        }

        let previous = null;
        let balanced = false;
        while (stack.length > 0) {
            previous = it;
            it = stack.pop();

            let balanceFactor = it.balanceFactor;
            if (!balanced) balanceFactor -= 1;
            if (balanceFactor === 0) balanced = true;
            [it, balanced] = new Node({...it, balanceFactor, right: previous}).balance();
        }

        return [popped.value, it];
    }

    balance(): [Node<T>, boolean] {
        let newNode: Node<T> = this;
        let balanced: boolean = false;
        log('balance() <- %O', newNode);

        if (newNode.balanceFactor < -1) {
            // We're left heavy
            if (newNode.left.balanceFactor === 1) {
                log('balance() : newNode.left.rotateLeft()');
                newNode = new Node<T>({
                    ...newNode,
                    left: newNode.left.rotateLeft(),
                });
            }

            log('balance() : newNode.rotateRight()');
            newNode = newNode.rotateRight();

            balanced = true;
        } else if (newNode.balanceFactor > 1) {
            // We're right heavy
            if (newNode.right.balanceFactor === -1){
                log('balance() : newNode.right.rotateRight()');
                newNode = new Node<T>({
                    ...newNode,
                    right: newNode.right.rotateRight(),
                });
            }
            log('balance() : newNode.rotateLeft()');
            newNode = newNode.rotateLeft();

            balanced = true;
        }

        log('balance() -> %O', newNode);
        return [newNode, balanced];
    }

    print(depth: number = 0) {
        if (this.left) this.left.print(depth + 1);
        const indent = '  '.repeat(depth);
        console.log('%s%o', indent, this.value);
        if (this.right) this.right.print(depth + 1);
    }
}
