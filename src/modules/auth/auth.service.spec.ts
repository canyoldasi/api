import { RoleEnum } from "../../providers/role.enum";
import { TestModule, TestService } from "../../../test/test.module";
import { AuthService } from "./auth.service"
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthService', ()=>{
    let service: AuthService;
    let testService: TestService;
    let mockDto: any;
    let resp: any;
    let fetched: any;

    beforeAll(async ()=> {
        const module: TestingModule = await Test.createTestingModule({
            imports: [TestModule]
        }).compile();
        await module.init();
        service = module.get<AuthService>(AuthService);
        testService = module.get<TestService>(TestService);
    });

    it('checkCredentials', async ()=>{
        resp = await service.checkCredentials(testService.username, testService.password);
        expect(resp).toMatchObject({
            username: testService.username
        })
    })
})