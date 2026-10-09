import { Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../config/database';

export const getPatients = (req: Request, res: Response) => {
    const patients = queryAll(`
        SELECT p.*, d.full_name as doctor_name
        FROM patients p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        ORDER BY p.full_name
    `);
    res.render('patients/index', { title: 'Bemorlar', patients });
};

export const createPatientForm = (req: Request, res: Response) => {
    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('patients/create', { title: 'Yangi Bemor', doctors });
};

export const createPatient = (req: Request, res: Response) => {
    const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;

    runSql(
        'INSERT INTO patients (full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id) VALUES (?,?,?,?,?,?,?,?)',
        [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null]
    );
    (req.session as any).success = 'Bemor muvaffaqiyatli ro\'yxatga olindi';
    res.redirect('/patients');
};

export const getPatientById = (req: Request, res: Response) => {
    const patient = queryOne(
        `SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty
         FROM patients p LEFT JOIN doctors d ON p.doctor_id=d.id
         WHERE p.id=?`,
        [req.params.id]
    );

    if (!patient) {
        (req.session as any).error = 'Bemor topilmadi';
        return res.redirect('/patients');
    }

    const illnesses = queryAll(
        `SELECT i.*, d.full_name as doctor_name, d.specialty as doctor_specialty
         FROM illnesses i JOIN doctors d ON i.doctor_id=d.id
         WHERE i.patient_id=? ORDER BY i.diagnosed_date DESC`,
        [req.params.id]
    );

    res.render('patients/show', { title: patient.full_name, patient, illnesses });
};

export const editPatientForm = (req: Request, res: Response) => {
    const patient = queryOne('SELECT * FROM patients WHERE id=?', [req.params.id]);

    if (!patient) {
        (req.session as any).error = 'Bemor topilmadi';
        return res.redirect('/patients');
    }

    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('patients/edit', { title: 'Bemorni Tahrirlash', patient, doctors });
};

export const updatePatient = (req: Request, res: Response) => {
    const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;

    runSql(
        'UPDATE patients SET full_name=?, date_of_birth=?, gender=?, phone=?, address=?, blood_type=?, emergency_contact=?, doctor_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null, req.params.id]
    );
    (req.session as any).success = 'Bemor ma\'lumotlari yangilandi';
    res.redirect(`/patients/${req.params.id}`);
};

export const deletePatient = (req: Request, res: Response) => {
    runSql('DELETE FROM patients WHERE id=?', [req.params.id]);
    (req.session as any).success = 'Ma\'lumot o\'chirildi';
    res.redirect('/patients');
};
