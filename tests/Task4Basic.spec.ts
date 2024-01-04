import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, TupleBuilder, Dictionary } from 'ton-core';
import { Task4Basic } from '../wrappers/Task4Basic';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task4Basic', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4Basic');
    });

    let blockchain: Blockchain;
    let task4Basic: SandboxContract<Task4Basic>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4Basic = blockchain.openContract(Task4Basic.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4Basic.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4Basic.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4Basic are ready to use
    });

    // it('testt', async () => {
    //     // the check is done inside beforeEach
    //     // blockchain and task3 are ready to use
    //     const r1 = new TupleBuilder();
    //     r1.writeString("S"); 
    //     r1.writeString("X");
    //     const r2 = new TupleBuilder();
    //     r2.writeString("."); 
    //     r2.writeString("?");
    //     const maze = new TupleBuilder();
    //     maze.writeTuple(r1.build());
    //     maze.writeTuple(r2.build());
    //     const tb = new TupleBuilder();
    //     tb.writeNumber(2);
    //     tb.writeNumber(2);
    //     tb.writeTuple(maze.build());

    //     // let exp = tb.writeCell

    //     const r = await blockchain.runGetMethod(task4Basic.address, "testt", tb.build())

    //     let rc = r.stackReader.readTuple()
    //     while (rc.remaining > 0) {
    //         console.log(rc.readTuple());
    //     }
    //     console.log("gasUsed: ", r.gasUsed.toString())
    //     // console.log("readTuple: ", rc)
    //     // let op = rc.beginParse().loadUint(32);
    //     // console.log("loadBits: ", op.toString())

    //     // expect(op).toBe(108)
    // });

    it('solve_work 8x5', async () => {
   
        const KEY_SHIFT = 5;                // 31 takes  5 bits
        const KEY_BSIZE = KEY_SHIFT * 2; // 31 << 5 + 31 takes 10 bits
        const VALUE_BSIZE = 32;
        const NODE_PATHS_LEN = 6;
        const VISITED_BSIZE = 1;

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
        
        const r = await blockchain.runGetMethod(task4Basic.address, "solve_work", tb.build())
        
        let rc = r.stackReader;
        const x = rc.readBigNumber();
        const q = rc.readBigNumber();
        const s = rc.readBigNumber();

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
        const paths_visited = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VISITED_BSIZE));
        const paths_values = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VISITED_BSIZE + VALUE_BSIZE));
        const paths_nodefroms = paths.beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(KEY_BSIZE), Dictionary.Values.Uint(VISITED_BSIZE + VALUE_BSIZE + KEY_BSIZE));
        const path_result_keys = paths_values.keys();
        const path_result_visited = paths_visited.values();
        const path_result_values = paths_values.values();
        const path_result_nodefroms = paths_nodefroms.values();
        const path_result = path_result_keys.flatMap((key, i) => [
            key >> KEY_SHIFT,
            key & 0x1f,
            path_result_visited[i],
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

        // expect(op).toBe(108)
    });

});
