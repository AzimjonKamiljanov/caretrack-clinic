import { isAuth, roleCheck } from '../../src/middlewares/auth.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = { session: {} as any };
        mockResponse = {
            redirect: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('isAuth', () => {
        it('should call next() if user is authenticated', () => {
            (mockRequest as any).session = { user: { id: 1, role: 'admin' } };
            isAuth(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.redirect).not.toHaveBeenCalled();
        });

        it('should redirect to /login if user is not authenticated', () => {
            isAuth(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.redirect).toHaveBeenCalledWith('/login');
        });
    });

    describe('roleCheck', () => {
        it('should call next() if user has the required role', () => {
            (mockRequest as any).session = { user: { id: 1, role: 'admin' } };
            const middleware = roleCheck(['admin']);
            middleware(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.redirect).not.toHaveBeenCalled();
        });

        it('should redirect back if user does not have the required role', () => {
            (mockRequest as any).session = { user: { id: 1, role: 'clinician' } };
            const middleware = roleCheck(['admin']);
            middleware(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.redirect).toHaveBeenCalledWith('back');
            expect((mockRequest as any).session.error).toBeDefined();
        });
    });
});
