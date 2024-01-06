import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, Dictionary, TupleBuilder } from 'ton-core';
import { Task4 } from '../wrappers/Task4';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task4', () => {
    let code: Cell;

    const KEY_SHIFT = 5;                // 31 takes  5 bits
    const KEY_BSIZE = KEY_SHIFT * 2; // 31 << 5 + 31 takes 10 bits
    const VALUE_BSIZE = 32;
    const NODE_PATHS_LEN = 5;

    beforeAll(async () => {
        code = await compile('Task4');
    });

    let blockchain: Blockchain;
    let task4: SandboxContract<Task4>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4 = blockchain.openContract(Task4.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4 are ready to use
    });

    it('solve_work 8x5', async () => {
        const n = 8;
        const m = 5;
        const r1 = new TupleBuilder();
        const r2 = new TupleBuilder();
        const r3 = new TupleBuilder();
        const r4 = new TupleBuilder();
        const r5 = new TupleBuilder();
        const r6 = new TupleBuilder();
        const r7 = new TupleBuilder();
        const r8 = new TupleBuilder();
        // r1.writeString("."); r1.writeString("."); r1.writeString("."); r1.writeString("."); r1.writeString(".");
        r1.writeNumber("S".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber("?".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0));
        r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0));
        r3.writeNumber("X".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber("?".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0));
        r4.writeNumber(".".charCodeAt(0)); r4.writeNumber("?".charCodeAt(0)); r4.writeNumber("?".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0));
        r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("?".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0));
        r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0));
        r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber("?".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0));
        r8.writeNumber("X".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber("E".charCodeAt(0));
        const maze = new TupleBuilder();
        maze.writeTuple(r1.build());
        maze.writeTuple(r2.build());
        maze.writeTuple(r3.build());
        maze.writeTuple(r4.build());
        maze.writeTuple(r5.build());
        maze.writeTuple(r6.build());
        maze.writeTuple(r7.build());
        maze.writeTuple(r8.build());
        const tb = new TupleBuilder();
        tb.writeNumber(n);
        tb.writeNumber(m);
        tb.writeTuple(maze.build());
        
        const r = await blockchain.runGetMethod(task4.address, "solve_work", tb.build())
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        var maze_input_tuple = rc.readTuple();
        var maze_input = [];
        var maze_input_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_input_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_input_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_input_dict_symbols.length; i += m) {
            maze_input.push(maze_input_dict_symbols.slice(i, i + m));
        }
        console.table(maze_input);
        
        var maze_result_tuple = rc.readTuple();
        var maze_result = [];
        const maze_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_result_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        const paths = rc.readCell();
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            BigInt(path_result_values[i] & 0xffffffff) & 0xffffffffn,
            (path_result_nodefroms[i] & 0x3ff) >> KEY_SHIFT,
            path_result_nodefroms[i] & 0x1f,
        ]);
        // console.log(path_result);
        const path_table = [];
        for (var i = 0; i < path_result.length; i += NODE_PATHS_LEN) {
            path_table.push(path_result.slice(i, i + NODE_PATHS_LEN));
        }
        console.table(path_table);

        console.log("gasUsed: ", r.gasUsed.toString())
        console.log("x: %d\tq: %d\ts: %d", x, q, s);

        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        expect(x).toBe(0)
        expect(q).toBe(1)
        expect(s).toBe(7)
    });

    it('solve_work 8x8', async () => {
        const n = 8;
        const m = 8;
        const r0 = new TupleBuilder();
        const r1 = new TupleBuilder();
        const r2 = new TupleBuilder();
        const r3 = new TupleBuilder();
        const r4 = new TupleBuilder();
        const r5 = new TupleBuilder();
        const r6 = new TupleBuilder();
        const r7 = new TupleBuilder();

        // XXXXXXE.
        // XX.XXXX.
        // X.X.XXXX
        // .?XSXXX.
        // ?.XXXXX.
        // XX..XXX.
        // XX..XX?X
        // XXX...XX
        r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("E".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); 
        r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); 
        r2.writeNumber("X".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); 
        r3.writeNumber(".".charCodeAt(0)); r3.writeNumber("?".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("S".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); 
        r4.writeNumber("?".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); 
        r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); 
        r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("?".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); 
        r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); 
        const maze = new TupleBuilder();
        maze.writeTuple(r0.build());
        maze.writeTuple(r1.build());
        maze.writeTuple(r2.build());
        maze.writeTuple(r3.build());
        maze.writeTuple(r4.build());
        maze.writeTuple(r5.build());
        maze.writeTuple(r6.build());
        maze.writeTuple(r7.build());
        const tb = new TupleBuilder();
        tb.writeNumber(n);
        tb.writeNumber(m);
        tb.writeTuple(maze.build());
        
        const r = await blockchain.runGetMethod(task4.address, "solve_work", tb.build())
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        var maze_input_tuple = rc.readTuple();
        var maze_input = [];
        var maze_input_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_input_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_input_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_input_dict_symbols.length; i += m) {
            maze_input.push(maze_input_dict_symbols.slice(i, i + m));
        }
        console.table(maze_input);
        
        var maze_result_tuple = rc.readTuple();
        var maze_result = [];
        const maze_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_result_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        const paths = rc.readCell();
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            BigInt(path_result_values[i] & 0xffffffff) & 0xffffffffn,
            (path_result_nodefroms[i] & 0x3ff) >> KEY_SHIFT,
            path_result_nodefroms[i] & 0x1f,
        ]);
        // console.log(path_result);
        const path_table = [];
        for (var i = 0; i < path_result.length; i += NODE_PATHS_LEN) {
            path_table.push(path_result.slice(i, i + NODE_PATHS_LEN));
        }
        console.table(path_table);

        console.log("gasUsed: ", r.gasUsed.toString())
        console.log("x: %d\tq: %d\ts: %d", x, q, s);

        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        expect(x).toBe(1)
        expect(q).toBe(1)
        expect(s).toBe(16)
    });

    it('solve_work 15x10', async () => {
        const n = 15;
        const m = 10;
        const r0 = new TupleBuilder();
        const r1 = new TupleBuilder();
        const r2 = new TupleBuilder();
        const r3 = new TupleBuilder();
        const r4 = new TupleBuilder();
        const r5 = new TupleBuilder();
        const r6 = new TupleBuilder();
        const r7 = new TupleBuilder();
        const r8 = new TupleBuilder();
        const r9 = new TupleBuilder();
        const r10 = new TupleBuilder();
        const r11 = new TupleBuilder();
        const r12 = new TupleBuilder();
        const r13 = new TupleBuilder();
        const r14 = new TupleBuilder();

        // XXXXXXE.
        // XX.XXXX.
        // X.X.XXXX
        // .?XSXXX.
        // ?.XXXXX.
        // XX..XXX.
        // XX..XX?X
        // XXX...XX
        r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("X".charCodeAt(0)); r0.writeNumber("E".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); 
        r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber("X".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); 
        r2.writeNumber("X".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); r2.writeNumber("X".charCodeAt(0)); 
        r3.writeNumber(".".charCodeAt(0)); r3.writeNumber("?".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("S".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber("X".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0));
        r4.writeNumber("?".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber("X".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0));
        r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber("X".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); 
        r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("?".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); r6.writeNumber("X".charCodeAt(0)); 
        r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); r7.writeNumber("X".charCodeAt(0)); 
        r8.writeNumber("X".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); r8.writeNumber("X".charCodeAt(0)); 
        r9.writeNumber("X".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); r9.writeNumber("X".charCodeAt(0)); 
        r10.writeNumber("X".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); r10.writeNumber("X".charCodeAt(0)); 
        r11.writeNumber("X".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); r11.writeNumber("X".charCodeAt(0)); 
        r12.writeNumber("X".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); r12.writeNumber("X".charCodeAt(0)); 
        r13.writeNumber("X".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); r13.writeNumber("X".charCodeAt(0)); 
        r14.writeNumber("X".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); r14.writeNumber("X".charCodeAt(0)); 
        const maze = new TupleBuilder();
        maze.writeTuple(r0.build());
        maze.writeTuple(r1.build());
        maze.writeTuple(r2.build());
        maze.writeTuple(r3.build());
        maze.writeTuple(r4.build());
        maze.writeTuple(r5.build());
        maze.writeTuple(r6.build());
        maze.writeTuple(r7.build());
        maze.writeTuple(r8.build());
        maze.writeTuple(r9.build());
        maze.writeTuple(r10.build());
        maze.writeTuple(r11.build());
        maze.writeTuple(r12.build());
        maze.writeTuple(r13.build());
        maze.writeTuple(r14.build());
        const tb = new TupleBuilder();
        tb.writeNumber(n);
        tb.writeNumber(m);
        tb.writeTuple(maze.build());
        
        const r = await blockchain.runGetMethod(task4.address, "solve_work", tb.build())
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        var maze_input_tuple = rc.readTuple();
        var maze_input = [];
        var maze_input_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_input_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_input_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_input_dict_symbols.length; i += m) {
            maze_input.push(maze_input_dict_symbols.slice(i, i + m));
        }
        console.table(maze_input);
        
        var maze_result_tuple = rc.readTuple();
        var maze_result = [];
        const maze_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_result_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        const paths = rc.readCell();
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            BigInt(path_result_values[i] & 0xffffffff) & 0xffffffffn,
            (path_result_nodefroms[i] & 0x3ff) >> KEY_SHIFT,
            path_result_nodefroms[i] & 0x1f,
        ]);
        // console.log(path_result);
        const path_table = [];
        for (var i = 0; i < path_result.length; i += NODE_PATHS_LEN) {
            path_table.push(path_result.slice(i, i + NODE_PATHS_LEN));
        }
        console.table(path_table);

        console.log("gasUsed: ", r.gasUsed.toString())
        console.log("x: %d\tq: %d\ts: %d", x, q, s);

        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        // expect(x).toBe(1)
        // expect(q).toBe(1)
        // expect(s).toBe(16)
    });


    it('solve_work 15x31', async () => {
        const n = 15;
        const m = 31;
        const r0 = new TupleBuilder();
        const r1 = new TupleBuilder();
        const r2 = new TupleBuilder();
        const r3 = new TupleBuilder();
        const r4 = new TupleBuilder();
        const r5 = new TupleBuilder();
        const r6 = new TupleBuilder();
        const r7 = new TupleBuilder();
        const r8 = new TupleBuilder();
        const r9 = new TupleBuilder();
        const r10 = new TupleBuilder();
        const r11 = new TupleBuilder();
        const r12 = new TupleBuilder();
        const r13 = new TupleBuilder();
        const r14 = new TupleBuilder();
        // const r15 = new TupleBuilder();
        // const r16 = new TupleBuilder();
        // const r17 = new TupleBuilder();
        // const r18 = new TupleBuilder();
        // const r19 = new TupleBuilder();
        // const r20 = new TupleBuilder();
        // const r21 = new TupleBuilder();
        // const r22 = new TupleBuilder();
        // const r23 = new TupleBuilder();
        // const r24 = new TupleBuilder();
        // const r25 = new TupleBuilder();
        // const r26 = new TupleBuilder();
        // const r27 = new TupleBuilder();
        // const r28 = new TupleBuilder();
        // const r29 = new TupleBuilder();
        // const r30 = new TupleBuilder();
        // SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXE
        r0.writeNumber("S".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); r0.writeNumber(".".charCodeAt(0)); 
        r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); r1.writeNumber(".".charCodeAt(0)); 
        r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); r2.writeNumber(".".charCodeAt(0)); 
        r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); r3.writeNumber(".".charCodeAt(0)); 
        r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); r4.writeNumber(".".charCodeAt(0)); 
        r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); r5.writeNumber(".".charCodeAt(0)); 
        r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); r6.writeNumber(".".charCodeAt(0)); 
        r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); r7.writeNumber(".".charCodeAt(0)); 
        r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); r8.writeNumber(".".charCodeAt(0)); 
        r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); r9.writeNumber(".".charCodeAt(0)); 
        r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); r10.writeNumber(".".charCodeAt(0)); 
        r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); r11.writeNumber(".".charCodeAt(0)); 
        r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); r12.writeNumber(".".charCodeAt(0)); 
        r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); r13.writeNumber(".".charCodeAt(0)); 
        r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber(".".charCodeAt(0)); r14.writeNumber("E".charCodeAt(0)); 

        // r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); r15.writeNumber(".".charCodeAt(0)); 
        // r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); r16.writeNumber(".".charCodeAt(0)); 
        // r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); r17.writeNumber(".".charCodeAt(0)); 
        // r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); r18.writeNumber(".".charCodeAt(0)); 
        // r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); r19.writeNumber(".".charCodeAt(0)); 
        // r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); r20.writeNumber(".".charCodeAt(0)); 
        // r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); r21.writeNumber(".".charCodeAt(0)); 
        // r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); r22.writeNumber(".".charCodeAt(0)); 
        // r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); r23.writeNumber(".".charCodeAt(0)); 
        // r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); r24.writeNumber(".".charCodeAt(0)); 
        // r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); r25.writeNumber(".".charCodeAt(0)); 
        // r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); r26.writeNumber(".".charCodeAt(0)); 
        // r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); r27.writeNumber(".".charCodeAt(0)); 
        // r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); r28.writeNumber(".".charCodeAt(0)); 
        // r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); r29.writeNumber("E".charCodeAt(0)); r29.writeNumber(".".charCodeAt(0)); 
        // r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber(".".charCodeAt(0)); r30.writeNumber("E".charCodeAt(0)); 
        const maze = new TupleBuilder();
        maze.writeTuple(r0.build());
        maze.writeTuple(r1.build());
        maze.writeTuple(r2.build());
        maze.writeTuple(r3.build());
        maze.writeTuple(r4.build());
        maze.writeTuple(r5.build());
        maze.writeTuple(r6.build());
        maze.writeTuple(r7.build());
        maze.writeTuple(r8.build());
        maze.writeTuple(r9.build());
        maze.writeTuple(r10.build());
        maze.writeTuple(r11.build());
        maze.writeTuple(r12.build());
        maze.writeTuple(r13.build());
        maze.writeTuple(r14.build());
        // maze.writeTuple(r15.build());
        // maze.writeTuple(r16.build());
        // maze.writeTuple(r17.build());
        // maze.writeTuple(r18.build());
        // maze.writeTuple(r19.build());
        // maze.writeTuple(r20.build());
        // maze.writeTuple(r21.build());
        // maze.writeTuple(r22.build());
        // maze.writeTuple(r23.build());
        // maze.writeTuple(r24.build());
        // maze.writeTuple(r25.build());
        // maze.writeTuple(r26.build());
        // maze.writeTuple(r27.build());
        // maze.writeTuple(r28.build());
        // maze.writeTuple(r29.build());
        // maze.writeTuple(r30.build());
        const tb = new TupleBuilder();
        tb.writeNumber(n);
        tb.writeNumber(m);
        tb.writeTuple(maze.build());
        
        const r = await blockchain.runGetMethod(task4.address, "solve_work", tb.build(), {gasLimit: 100_000_000n})
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        var maze_input_tuple = rc.readTuple();
        var maze_input = [];
        var maze_input_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_input_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_input_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_input_dict_symbols.length; i += m) {
            maze_input.push(maze_input_dict_symbols.slice(i, i + m));
        }
        console.table(maze_input);
        
        var maze_result_tuple = rc.readTuple();
        var maze_result = [];
        const maze_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_result_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        const paths = rc.readCell();
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            BigInt(path_result_values[i] & 0xffffffff) & 0xffffffffn,
            (path_result_nodefroms[i] & 0x3ff) >> KEY_SHIFT,
            path_result_nodefroms[i] & 0x1f,
        ]);
        // console.log(path_result);
        const path_table = [];
        for (var i = 0; i < path_result.length; i += NODE_PATHS_LEN) {
            path_table.push(path_result.slice(i, i + NODE_PATHS_LEN));
        }
        console.table(path_table);

        console.log("gasUsed: ", r.gasUsed.toString())
        console.log("x: %d\tq: %d\ts: %d", x, q, s);

        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        // expect(x).toBe(1)
        // expect(q).toBe(1)
        // expect(s).toBe(16)
    });

    it('solve_work_16x30', async () => {
        const methodName = 'solve_work_16x30'
        const n =16;
        const m =30;
        const r = await blockchain.runGetMethod(task4.address, methodName, [],  {gasLimit: 100_000_000n})
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        var maze_input_tuple = rc.readTuple();
        var maze_input = [];
        var maze_input_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_input_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_input_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_input_dict_symbols.length; i += m) {
            maze_input.push(maze_input_dict_symbols.slice(i, i + m));
        }
        console.table(maze_input);
        
        var maze_result_tuple = rc.readTuple();
        var maze_result = [];
        const maze_dict_symbols = [];
        for (let i = 0; i < n; i++) {
            var row_result = maze_result_tuple.readTuple()
            for (let j = 0; j < m; j++) {
                maze_dict_symbols.push(String.fromCharCode(row_result.readNumber()));
            }
        }
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        const paths = rc.readCell();
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            BigInt(path_result_values[i] & 0xffffffff) & 0xffffffffn,
            (path_result_nodefroms[i] & 0x3ff) >> KEY_SHIFT,
            path_result_nodefroms[i] & 0x1f,
        ]);
        const path_table = [];
        for (var i = 0; i < path_result.length; i += NODE_PATHS_LEN) {
            path_table.push(path_result.slice(i, i + NODE_PATHS_LEN));
        }
        console.table(path_table);

        console.log(methodName + " - gasUsed: ", r.gasUsed.toString())
        console.log(methodName + " - x: %d\tq: %d\ts: %d", x, q, s);

        expect(x).toBe(28)
        expect(q).toBe(0)
        expect(s).toBe(29)
    });

    it('solve_work_32x32', async () => {   
        const methodName = 'solve_work_32x32';
        const r = await blockchain.runGetMethod(task4.address, methodName, [],  {gasLimit: 100_000_000n})
        
        let rc = r.stackReader;
        const x = rc.readNumber();
        const q = rc.readNumber();
        const s = rc.readNumber();

        console.log(methodName + " - gasUsed: ", r.gasUsed.toString())
        console.log(methodName + " - x: %d\tq: %d\ts: %d", x, q, s);

        expect(x).toBe(30)
        expect(q).toBe(0)
        expect(s).toBe(31)
    });


});
