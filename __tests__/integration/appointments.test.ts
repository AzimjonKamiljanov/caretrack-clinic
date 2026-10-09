import request from 'supertest';
import { initApp } from '../../src/app';
import { runSql, queryOne } from '../../src/config/database';

let app: any;

beforeAll(async () => {
    app = await initApp();
    // Setup initial data for appointments testing
    runSql('DELETE FROM appointments');
    runSql('DELETE FROM patients');
    runSql('DELETE FROM doctors');

    runSql('INSERT INTO doctors (id, full_name, specialty) VALUES (1, "Test Doctor", "Test")');
    runSql('INSERT INTO patients (id, full_name, doctor_id) VALUES (1, "Test Patient", 1)');
});

describe('Appointments API', () => {
    let agent: any;

    beforeAll(async () => {
        agent = request.agent(app);
        // Login as receptionist for appointment management
        await agent.post('/mock-login').send({ id: 2, role: 'receptionist', full_name: 'Receptionist' });
    });

    it('should list empty appointments initially', async () => {
        const response = await agent.get('/appointments');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Appointments');
    });

    it('should create an appointment', async () => {
        const response = await agent.post('/appointments').send({
            patient_id: 1,
            doctor_id: 1,
            appointment_date: '2026-01-01 10:00:00',
            status: 'Scheduled',
            reason: 'Test Reason'
        });

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/appointments');

        const getResponse = await agent.get('/appointments');
        expect(getResponse.text).toContain('Test Patient');
        expect(getResponse.text).toContain('Test Doctor');
    });

    it('should update an appointment', async () => {
        const appt = queryOne('SELECT id FROM appointments LIMIT 1');

        const response = await agent.post(`/appointments/${appt.id}`).send({
            patient_id: 1,
            doctor_id: 1,
            appointment_date: '2026-01-01 11:00:00',
            status: 'Completed',
            reason: 'Updated Reason'
        });

        expect(response.status).toBe(302);

        const getResponse = await agent.get('/appointments');
        expect(getResponse.text).toContain('Completed');
        expect(getResponse.text).toContain('Updated Reason');
    });

    it('should delete an appointment if admin', async () => {
        const appt = queryOne('SELECT id FROM appointments LIMIT 1');

        // Receptionist cannot delete
        let response = await agent.post(`/appointments/${appt.id}/delete`);
        expect(response.status).toBe(302); // Should redirect back due to roleCheck

        // Login as admin
        const adminAgent = request.agent(app);
        await adminAgent.post('/mock-login').send({ id: 1, role: 'admin', full_name: 'Admin' });

        response = await adminAgent.post(`/appointments/${appt.id}/delete`);
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/appointments');

        const getResponse = await adminAgent.get('/appointments');
        expect(getResponse.text).not.toContain('Updated Reason');
    });
});
