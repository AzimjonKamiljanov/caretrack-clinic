import request from 'supertest';
import { initApp } from '../../src/app';
import { runSql } from '../../src/config/database';

let app: any;

beforeAll(async () => {
    app = await initApp();
    // Clear patients table before tests
    runSql('DELETE FROM patients');
});

describe('Patients API', () => {
    let agent: any;

    beforeAll(async () => {
        agent = request.agent(app);
        // Mock login as admin
        await agent.post('/mock-login').send({ id: 1, role: 'admin', full_name: 'Admin' });
    });

    it('should list empty patients initially', async () => {
        const response = await agent.get('/patients');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Bemorlar');
    });

    it('should fail to create a patient with invalid data', async () => {
        const response = await agent.post('/patients').send({ full_name: '' });
        expect(response.status).toBe(302); // Redirect back on validation error
    });

    it('should create a patient successfully', async () => {
        const response = await agent.post('/patients').send({
            full_name: 'Test Patient',
            gender: 'Erkak',
            phone: '123456789'
        });
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/patients');

        const getResponse = await agent.get('/patients');
        expect(getResponse.text).toContain('Test Patient');
    });
});
