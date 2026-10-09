import { Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../config/database';

export const getDoctors = (req: Request, res: Response) => {
    const doctors = queryAll('SELECT * FROM doctors ORDER BY full_name');
    res.render('doctors/index', { title: 'Shifokorlar', doctors });
};

export const createDoctorForm = (req: Request, res: Response) => {
    res.render('doctors/create', { title: 'Yangi Shifokor' });
};

export const createDoctor = (req: Request, res: Response) => {
    const { full_name, specialty, phone, email, experience_years, bio } = req.body;

    runSql(
        'INSERT INTO doctors (full_name, specialty, phone, email, experience_years, bio) VALUES (?,?,?,?,?,?)',
        [full_name, specialty, phone || null, email || null, experience_years || 0, bio || null]
    );
    (req.session as any).success = 'Shifokor ro\'yxatga olindi';
    res.redirect('/doctors');
};

export const getDoctorById = (req: Request, res: Response) => {
    const doctor = queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]);

    if (!doctor) {
        (req.session as any).error = 'Shifokor topilmadi';
        return res.redirect('/doctors');
    }

    const patients = queryAll('SELECT id, full_name, phone FROM patients WHERE doctor_id=?', [req.params.id]);

    res.render('doctors/show', { title: doctor.full_name, doctor, patients });
};

export const editDoctorForm = (req: Request, res: Response) => {
    const doctor = queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]);

    if (!doctor) {
        (req.session as any).error = 'Shifokor topilmadi';
        return res.redirect('/doctors');
    }

    res.render('doctors/edit', { title: 'Shifokorni Tahrirlash', doctor });
};

export const updateDoctor = (req: Request, res: Response) => {
    const { full_name, specialty, phone, email, experience_years, bio } = req.body;

    runSql(
        'UPDATE doctors SET full_name=?, specialty=?, phone=?, email=?, experience_years=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [full_name, specialty, phone || null, email || null, experience_years || 0, bio || null, req.params.id]
    );
    (req.session as any).success = 'Ma\'lumotlar yangilandi';
    res.redirect(`/doctors/${req.params.id}`);
};

export const deleteDoctor = (req: Request, res: Response) => {
    runSql('DELETE FROM doctors WHERE id=?', [req.params.id]);
    (req.session as any).success = 'Shifokor o\'chirildi';
    res.redirect('/doctors');
};
