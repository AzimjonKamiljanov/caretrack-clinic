import { Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../config/database';

export const getIllnesses = (req: Request, res: Response) => {
    const illnesses = queryAll(
        `SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name, d.specialty as doctor_specialty
         FROM illnesses i
         JOIN patients p ON i.patient_id=p.id
         JOIN doctors d ON i.doctor_id=d.id
         ORDER BY i.diagnosed_date DESC`
    );
    res.render('illnesses/index', { title: 'Kasalliklar / Tashxislar', illnesses });
};

export const createIllnessForm = (req: Request, res: Response) => {
    const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('illnesses/create', { title: 'Yangi Tashxis', patients, doctors });
};

export const createIllness = (req: Request, res: Response) => {
    const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;

    runSql(
        'INSERT INTO illnesses (patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date) VALUES (?,?,?,?,?,?,?)',
        [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status || 'Faol', diagnosed_date || new Date().toISOString().split('T')[0]]
    );
    (req.session as any).success = 'Tashxis muvaffaqiyatli qo\'shildi';
    res.redirect('/illnesses');
};

export const editIllnessForm = (req: Request, res: Response) => {
    const illness = queryOne('SELECT * FROM illnesses WHERE id=?', [req.params.id]);

    if (!illness) {
        (req.session as any).error = 'Tashxis topilmadi';
        return res.redirect('/illnesses');
    }

    const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('illnesses/edit', { title: 'Tashxisni Tahrirlash', illness, patients, doctors });
};

export const updateIllness = (req: Request, res: Response) => {
    const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;

    runSql(
        'UPDATE illnesses SET patient_id=?, doctor_id=?, diagnosis=?, description=?, prescribed_meds=?, status=?, diagnosed_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status, diagnosed_date, req.params.id]
    );
    (req.session as any).success = 'Tashxis muvaffaqiyatli yangilandi';
    res.redirect('/illnesses');
};

export const deleteIllness = (req: Request, res: Response) => {
    runSql('DELETE FROM illnesses WHERE id=?', [req.params.id]);
    (req.session as any).success = 'Tashxis o\'chirildi';
    res.redirect('/illnesses');
};
