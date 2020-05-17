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
                }
                if (comparison > 0) {
                    it = it.right;
                }
            }
        }

        let newNode = new Node<T>({ value });
        let balanced = false;

        while (stack.length > 0) {
            [comparison, it] = stack.shift();
            //let [value, balance, left, right] = it;

            if (comparison < 0) {
                const left = newNode;
                let balance = it.balance;
                if (!balanced) balance -= 1;
                newNode = new Node<T>({ ...it, left, balance });
            } else {
                const right = newNode;
                let balance = it.balance;
                if (!balanced) balance += 1;
                newNode = new Node<T>({ ...it, right, balance });
            }

            if (newNode.balance === 0) {
                balanced = true;
            }

            if (balanced) {
                continue;
            }

            if (newNode.balance < -1) {
                // We're left heavy
                if (newNode.left.balance === 1)
                    newNode = new Node<T>({
                        ...newNode,
                        left: newNode.left.rotateLeft(),
                    });

                newNode = newNode.rotateRight();
                balanced = true;
            } else if (newNode.balance > 1) {
                // We're right heavy
                if (newNode.right.balance === -1)
                    newNode = new Node<T>({
                        ...newNode,
                        right: newNode.right.rotateRight(),
                    });
                newNode = newNode.rotateLeft();
                balanced = true;
            }
        }

        const size = this.size + 1;
        const root = newNode;

        return new Tree({ ...this, size, root });
    }

    take(value: T) {
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

        if (it.left && it.right) {
            if (it.balance > 0) {
                // Right heavy, so take from the right side
                let [left, root] = it.left.takeRightMost();
            } else {
                let [right, root] = it.right.takeLeftMost();
            }
        }
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
    balance: number;
    left: Node<T>;
    right: Node<T>;

    constructor({
        value = null,
        balance = 0,
        left = null,
        right = null,
    }: Partial<Node<T>> = {}) {
        this.value = value;
        this.balance = balance;
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

            let balance = this.balance + 1;
            if (this.left.balance < 0) {
                balance -= this.left.balance;
            }

            right = new Node<T>({ ...this, left, balance });
        }

        {
            /**
             * Recompute the balance for the new root node;
             * export the new root node. Use the previously exported
             * new right node as our right.
             */
            let balance = this.left.balance + 1;
            if (right.balance > 0) balance -= right.balance;
            root = new Node<T>({ ...this.left, balance, right });
        }

        return root;
    }

    rotateLeft(): Node<T> {
        log('rotateLeft(%o)', this);
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
            let balance = this.balance - 1;
            if (this.right.balance > 0) balance -= this.right.balance;
            left = new Node<T>({ ...this, balance, right });
        }

        {
            let balance = this.right.balance - 1;
            if (left.balance < 0) balance -= left.balance;
            root = new Node<T>({ ...this.right, balance, left });
        }

        return root;
    }

    print(depth: number = 0) {
        if (this.left) this.left.print(depth + 1);
        const indent = '  '.repeat(depth);
        console.log('%s%o', indent, this.value);
        if (this.right) this.right.print(depth + 1);
    }
}
