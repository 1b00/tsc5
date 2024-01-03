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

    it('solve_work', async () => {
        const key_shift = 5;                // 31 takes  5 bits
        const key_bit_size = 10; // 31 << 5 + 31 takes 10 bits

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
        r1.writeString("S"); r1.writeString("X"); r1.writeString("."); r1.writeString("?"); r1.writeString("X");
        r2.writeString("."); r2.writeString("X"); r2.writeString("X"); r2.writeString("."); r2.writeString("X");
        r3.writeString("X"); r3.writeString("."); r3.writeString("?"); r3.writeString("."); r3.writeString(".");
        r4.writeString("."); r4.writeString("?"); r4.writeString("?"); r4.writeString("."); r4.writeString(".");
        r5.writeString("X"); r5.writeString("?"); r5.writeString("."); r5.writeString("."); r5.writeString(".");
        r6.writeString("."); r6.writeString("."); r6.writeString("X"); r6.writeString("."); r6.writeString("X");
        r7.writeString("."); r7.writeString("."); r7.writeString("?"); r7.writeString("."); r7.writeString(".");
        r8.writeString("X"); r8.writeString("."); r8.writeString("."); r8.writeString("."); r8.writeString("E");
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
        console.log("result: ", rc)
        const x = rc.readBigNumber();
        const q = rc.readBigNumber();
        const s = rc.readBigNumber();
        console.log("x: %d\tq: %d\ts: %d", x, q, s);
        console.log(rc.readTupleOpt());
        let maze_dict_int = rc.readCell()
            .beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(key_bit_size), Dictionary.Values.Uint(8));
        var maze_result = [];
        var maze_dict_symbols = maze_dict_int.values().map(element => {
            return String.fromCharCode(element)
        });
        for (var i=0; i < maze_dict_symbols.length; i += m) {
            maze_result.push(maze_dict_symbols.slice(i, i + m));
        }
        console.table(maze_result);

        console.log("gasUsed: ", r.gasUsed.toString())
        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        // expect(op).toBe(108)
    });

});
