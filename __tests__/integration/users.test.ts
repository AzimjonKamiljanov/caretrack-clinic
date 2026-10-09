import request from 'supertest';
import { initApp } from '../../src/app';
import { runSql, queryOne } from '../../src/config/database';

let app: any;

beforeAll(async () => {
    app = await initApp();
    runSql('DELETE FROM users');
    // Ensure test doesn't break if run multiple times
    runSql('INSERT INTO users (id, username, password, full_name, role) VALUES (1, "admin1", "pass", "Admin", "admin")');
});

describe('Users API', () => {
    let agent: any;

    beforeAll(async () => {
        agent = request.agent(app);
        await agent.post('/mock-login').send({ id: 1, role: 'admin', full_name: 'Admin' });
    });

    it('should list users', async () => {
        const response = await agent.get('/users');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Foydalanuvchilar');
    });

    it('should create a user successfully', async () => {
        const response = await agent.post('/users').send({
            username: 'new_user',
            password: 'password123',
            full_name: 'New User',
            role: 'clinician'
        });

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/users');

        const getResponse = await agent.get('/users');
        expect(getResponse.text).toContain('new_user');
        expect(getResponse.text).toContain('New User');
    });

    it('should fail to create a user if username is taken', async () => {
        const response = await agent.post('/users').send({
            username: 'new_user',
            password: 'password123',
            full_name: 'Another User',
            role: 'receptionist'
        });
        expect(response.status).toBe(302);

        const getResponse = await agent.get('/users/create');
        expect(getResponse.text).not.toContain('Another User');
    });

    it('should delete a user but not self', async () => {
        const user = queryOne('SELECT id FROM users WHERE username="new_user"');

        const response = await agent.post(`/users/${user.id}/delete`);
        expect(response.status).toBe(302);

        const getResponse = await agent.get('/users');
        expect(getResponse.text).not.toContain('new_user');

        const selfResponse = await agent.post(`/users/1/delete`);
        expect(selfResponse.status).toBe(302); // Redirect back with error
    });
});
