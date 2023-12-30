import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, Address, TupleBuilder } from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { pseudoRandomBytes } from 'crypto';

describe('Task2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task2 = blockchain.openContract(Task2.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task2 are ready to use
    });

    it('should test', async () => {
        const newOwner = new Address(0, pseudoRandomBytes(256 / 8));

    });

    it('fibonacci_sequence', async () => {
        // the check is done inside beforeEach
        // blockchain and task3 are ready to use
        const tb = new TupleBuilder();
        tb.writeNumber(201);
        tb.writeNumber(4);

        // let exp = tb.writeCell

        const r = await blockchain.runGetMethod(task2.address, "test_case", tb.build())

        // let rc = r.stackReader.readBigNumber()
        console.log("gasUsed: ", r.gasUsed.toString())
        // console.log("rc: ", rc.toString())
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        // expect(op).toBe(108)
    });

});
