import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, TupleBuilder } from 'ton-core';
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

    it('testt', async () => {
        // the check is done inside beforeEach
        // blockchain and task3 are ready to use
        const tb = new TupleBuilder();
        tb.writeNumber(201);
        tb.writeNumber(4);

        // let exp = tb.writeCell

        const r = await blockchain.runGetMethod(task4Basic.address, "testt", tb.build())

        let rc = r.stackReader.readTuple()
        while (rc.remaining > 0) {
            console.log(rc.readTuple());
        }
        console.log("gasUsed: ", r.gasUsed.toString())
        // console.log("readTuple: ", rc)
        // let op = rc.beginParse().loadUint(32);
        // console.log("loadBits: ", op.toString())

        // expect(op).toBe(108)
    });

});
