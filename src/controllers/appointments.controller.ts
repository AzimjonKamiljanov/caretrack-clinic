import { Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../config/database';

export const getAppointments = (req: Request, res: Response) => {
    const appointments = queryAll(`
        SELECT a.*, p.full_name as patient_name, d.full_name as doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        ORDER BY a.appointment_date DESC
    `);
    res.render('appointments/index', { title: 'Appointments', appointments });
};

export const createAppointmentForm = (req: Request, res: Response) => {
    const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('appointments/create', { title: 'New Appointment', patients, doctors });
};

export const createAppointment = (req: Request, res: Response) => {
    const { patient_id, doctor_id, appointment_date, status, reason } = req.body;

    if (!patient_id || !doctor_id || !appointment_date) {
        (req.session as any).error = 'Patient, Doctor and Date are required';
        return res.redirect('/appointments/create');
    }

    runSql(
        'INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason) VALUES (?, ?, ?, ?, ?)',
        [parseInt(patient_id), parseInt(doctor_id), appointment_date, status || 'Scheduled', reason || null]
    );
    (req.session as any).success = 'Appointment created successfully';
    res.redirect('/appointments');
};

export const editAppointmentForm = (req: Request, res: Response) => {
    const appointment = queryOne('SELECT * FROM appointments WHERE id=?', [req.params.id]);
    if (!appointment) {
        (req.session as any).error = 'Appointment not found';
        return res.redirect('/appointments');
    }
    const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
    const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
    res.render('appointments/edit', { title: 'Edit Appointment', appointment, patients, doctors });
};

export const updateAppointment = (req: Request, res: Response) => {
    const { patient_id, doctor_id, appointment_date, status, reason } = req.body;

    runSql(
        'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, status=?, reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [parseInt(patient_id), parseInt(doctor_id), appointment_date, status, reason || null, req.params.id]
    );
    (req.session as any).success = 'Appointment updated successfully';
    res.redirect('/appointments');
};

export const deleteAppointment = (req: Request, res: Response) => {
    runSql('DELETE FROM appointments WHERE id=?', [req.params.id]);
    (req.session as any).success = 'Appointment deleted';
    res.redirect('/appointments');
};
