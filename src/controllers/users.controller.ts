import { Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../config/database';
import bcrypt from 'bcryptjs';

export const getUsers = (req: Request, res: Response) => {
    const users = queryAll('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
    res.render('users/index', { title: 'Foydalanuvchilar', users });
};

export const createUserForm = (req: Request, res: Response) => {
    res.render('users/create', { title: 'Yangi Foydalanuvchi' });
};

export const createUser = (req: Request, res: Response) => {
    const { username, password, full_name, role } = req.body;

    const existing = queryOne('SELECT id FROM users WHERE username=?', [username]);
    if (existing) {
        (req.session as any).error = 'Bu username allaqachon mavjud';
        return res.redirect('/users/create');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    runSql(
        'INSERT INTO users (username, password, full_name, role) VALUES (?,?,?,?)',
        [username, hashedPassword, full_name, role]
    );
    (req.session as any).success = 'Foydalanuvchi muvaffaqiyatli yaratildi';
    res.redirect('/users');
};

export const editUserForm = (req: Request, res: Response) => {
    const editUser = queryOne('SELECT id, username, full_name, role FROM users WHERE id=?', [req.params.id]);

    if (!editUser) {
        (req.session as any).error = 'Foydalanuvchi topilmadi';
        return res.redirect('/users');
    }

    res.render('users/edit', { title: 'Foydalanuvchini Tahrirlash', editUser });
};

export const updateUser = (req: Request, res: Response) => {
    const { username, password, full_name, role } = req.body;

    if (password && password.trim()) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        runSql(
            'UPDATE users SET username=?, password=?, full_name=?, role=? WHERE id=?',
            [username, hashedPassword, full_name, role, req.params.id]
        );
    } else {
        runSql(
            'UPDATE users SET username=?, full_name=?, role=? WHERE id=?',
            [username, full_name, role, req.params.id]
        );
    }
    (req.session as any).success = 'Foydalanuvchi yangilandi';
    res.redirect('/users');
};

export const deleteUser = (req: Request, res: Response) => {
    if (parseInt(req.params.id as string) === (req.session as any).user.id) {
        (req.session as any).error = 'O\'zingizni o\'chira olmaysiz';
        return res.redirect('/users');
    }
    runSql('DELETE FROM users WHERE id=?', [req.params.id]);
    (req.session as any).success = 'Foydalanuvchi o\'chirildi';
    res.redirect('/users');
};
