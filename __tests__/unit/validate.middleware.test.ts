import { validate } from '../../src/middlewares/validate.middleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const testSchema = z.object({
    name: z.string().min(1, 'Name is required')
});

describe('Validate Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = { body: {}, session: {} as any };
        mockResponse = {
            redirect: jest.fn()
        };
        nextFunction = jest.fn();
    });

    it('should call next() if validation passes', async () => {
        mockRequest.body = { name: 'Test User' };
        const middleware = validate(testSchema as any);
        await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(nextFunction).toHaveBeenCalledWith();
        expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect back with error if validation fails', async () => {
        mockRequest.body = { name: '' }; // Invalid
        const middleware = validate(testSchema as any);
        await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.redirect).toHaveBeenCalledWith('back');
        expect((mockRequest as any).session.error).toContain('Name is required');
    });
});
