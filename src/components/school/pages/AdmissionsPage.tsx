'use client';

// src/components/school/pages/AdmissionsPage.tsx
// Full admissions form with Paystack payment for application fee.
// On submission: collects form data, initialises Paystack popup,
// verifies payment on callback, then submits application to API.

import { useState, type CSSProperties } from 'react';
import type { SchoolWebsiteConfig, Template } from '@/types/school-website';
import { SectionHeading } from '../SectionHeading';
import { submitAdmissionApplication, verifyApplicationPayment } from '@/lib/school-website-api';

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

interface Props {
  config: SchoolWebsiteConfig;
  template: Template;
}

interface FormState {
  // Student
  studentFirstName: string;
  studentLastName: string;
  studentDob: string;
  studentGender: string;
  classApplyingFor: string;
  previousSchool: string;
  // Parent
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: string;
  parentAddress: string;
}

type Step = 'form' | 'payment' | 'success' | 'error';

const INITIAL_FORM: FormState = {
  studentFirstName: '',
  studentLastName: '',
  studentDob: '',
  studentGender: '',
  classApplyingFor: '',
  previousSchool: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  parentRelationship: '',
  parentAddress: '',
};

export function AdmissionsPage({ config, template }: Props) {
  const { admissions } = config;
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const update = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.studentFirstName.trim()) newErrors.studentFirstName = 'Required';
    if (!form.studentLastName.trim()) newErrors.studentLastName = 'Required';
    if (!form.studentDob) newErrors.studentDob = 'Required';
    if (!form.studentGender) newErrors.studentGender = 'Required';
    if (!form.classApplyingFor) newErrors.classApplyingFor = 'Required';
    if (!form.parentName.trim()) newErrors.parentName = 'Required';
    if (!form.parentPhone.trim()) newErrors.parentPhone = 'Required';
    if (!form.parentEmail.trim()) newErrors.parentEmail = 'Required';
    if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
      newErrors.parentEmail = 'Invalid email address';
    }
    if (!form.parentRelationship) newErrors.parentRelationship = 'Required';
    if (!form.parentAddress.trim()) newErrors.parentAddress = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (admissions.requiresPayment && admissions.applicationFeeNaira > 0) {
      await initiatePaystackPayment();
    } else {
      await submitApplication(null);
    }
  };

  const initiatePaystackPayment = async () => {
    // Load Paystack script lazily
    if (!window.PaystackPop) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Paystack'));
        document.head.appendChild(script);
      });
    }

    const reference = `schoolos_adm_${config.schoolId}_${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: admissions.paystackPublicKey,
      email: form.parentEmail,
      amount: admissions.applicationFeeNaira * 100,  // kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          { display_name: 'Applicant', variable_name: 'applicant', value: `${form.studentFirstName} ${form.studentLastName}` },
          { display_name: 'School', variable_name: 'school', value: config.schoolName },
          { display_name: 'Class', variable_name: 'class', value: form.classApplyingFor },
        ],
      },
      callback: async (response) => {
        setIsSubmitting(true);
        // Verify payment on our backend first, then submit application
        const verification = await verifyApplicationPayment(config.slug, response.reference);
        if (verification.verified) {
          await submitApplication(response.reference);
        } else {
          setErrorMessage('Payment verification failed. Please contact the school office.');
          setStep('error');
        }
        setIsSubmitting(false);
      },
      onClose: () => {
        // User closed popup without paying — do nothing
      },
    });

    handler.openIframe();
  };

  const submitApplication = async (paystackReference: string | null) => {
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('schoolId', config.schoolId);
    formData.append('sessionLabel', admissions.sessionLabel);
    if (paystackReference) formData.append('paystackReference', paystackReference);

    const result = await submitAdmissionApplication(config.slug, formData);

    if (result.success) {
      setApplicationId(result.applicationId ?? null);
      setStep('success');
    } else {
      setErrorMessage(result.error ?? 'Submission failed. Please try again.');
      setStep('error');
    }

    setIsSubmitting(false);
  };

  // -------------------------------------------------------------------------
  // CLOSED STATE
  // -------------------------------------------------------------------------

  if (!admissions.isOpen) {
    return (
      <div style={{ padding: '80px 24px', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px', fontWeight: 700,
            color: template.colors.text, marginBottom: '16px',
          }}>
            Admissions Currently Closed
          </h2>
          <p style={{ fontSize: '17px', color: template.colors.textLight, lineHeight: 1.7 }}>
            Admissions for {admissions.sessionLabel} are currently closed. Please check back or contact the school office for information about upcoming admission periods.
          </p>
          <div style={{ marginTop: '32px', padding: '20px', borderRadius: '8px', backgroundColor: template.colors.surface, border: `1px solid ${template.colors.border}` }}>
            <p style={{ fontSize: '14px', color: template.colors.textLight }}>
              📞 {config.contact.phone} &nbsp;&nbsp; ✉️ {config.contact.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // SUCCESS STATE
  // -------------------------------------------------------------------------

  if (step === 'success') {
    return (
      <div style={{ padding: '80px 24px', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: '#22C55E22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="40" height="40" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <path d="M20 2a18 18 0 100 36A18 18 0 0020 2zm-3 26l-7-7 2-2 5 5 11-11 2 2z" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px', fontWeight: 700,
            color: template.colors.text, marginBottom: '16px',
          }}>
            Application Submitted!
          </h2>
          <p style={{ fontSize: '17px', color: template.colors.textLight, lineHeight: 1.7, marginBottom: '24px' }}>
            Thank you, <strong>{form.parentName}</strong>. Your application for{' '}
            <strong>{form.studentFirstName} {form.studentLastName}</strong> to join{' '}
            <strong>{form.classApplyingFor}</strong> has been received.
          </p>
          {applicationId && (
            <div style={{
              padding: '16px 24px', borderRadius: '8px',
              backgroundColor: template.colors.surface,
              border: `1px solid ${template.colors.border}`,
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '12px', color: template.colors.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Application Reference</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: template.colors.primary, fontFamily: 'monospace' }}>{applicationId}</div>
            </div>
          )}
          <p style={{ fontSize: '14px', color: template.colors.textLight }}>
            A confirmation email has been sent to <strong>{form.parentEmail}</strong>. The admissions office will contact you within 5 business days.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------------------------

  if (step === 'error') {
    return (
      <div style={{ padding: '80px 24px', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: template.colors.text, marginBottom: '16px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '16px', color: template.colors.textLight, marginBottom: '32px' }}>{errorMessage}</p>
          <button
            onClick={() => { setStep('form'); setErrorMessage(''); }}
            style={{
              padding: '14px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: template.colors.primary, color: '#FFF',
              fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // FORM
  // -------------------------------------------------------------------------

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1.5px solid ${template.colors.border}`,
    backgroundColor: template.colors.surface,
    color: template.colors.text,
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: template.colors.text,
    marginBottom: '6px',
    letterSpacing: '0.02em',
  };

  const errorStyle: CSSProperties = {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '4px',
  };

  const Field = ({
    label, field, type = 'text', options, required = false, placeholder,
  }: {
    label: string;
    field: keyof FormState;
    type?: string;
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }) => (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {options ? (
        <select
          value={form[field]}
          onChange={e => update(field, e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Select {label}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[field]}
          onChange={e => update(field, e.target.value)}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            borderColor: errors[field] ? '#EF4444' : template.colors.border,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = template.colors.primary; }}
          onBlur={e => { e.currentTarget.style.borderColor = errors[field] ? '#EF4444' : template.colors.border; }}
        />
      )}
      {errors[field] && <p style={errorStyle}>{errors[field]}</p>}
    </div>
  );

  return (
    <div style={{ padding: '64px 24px 80px', backgroundColor: template.colors.background }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <SectionHeading
          template={template}
          eyebrow={`${admissions.sessionLabel} Admissions`}
          title={`Apply to\n${config.schoolName}`}
        />

        {/* Info cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px', marginBottom: '48px',
        }}>
          {[
            {
              icon: '🏫',
              title: 'Available Classes',
              content: admissions.availableClasses.join(', '),
            },
            {
              icon: '💳',
              title: 'Application Fee',
              content: admissions.applicationFeeNaira > 0
                ? `₦${admissions.applicationFeeNaira.toLocaleString('en-NG')} (paid online)`
                : 'Free',
            },
            {
              icon: '📅',
              title: 'Application Deadline',
              content: admissions.deadline
                ? new Date(admissions.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Rolling admissions',
            },
          ].map((card, i) => (
            <div key={i} style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: template.colors.surface,
              border: `1px solid ${template.colors.border}`,
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: template.colors.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: template.colors.text }}>{card.content}</div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        {admissions.requirements.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderRadius: '10px',
            backgroundColor: `${template.colors.secondary}22`,
            border: `1px solid ${template.colors.secondary}44`,
            marginBottom: '40px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: template.colors.primary, marginBottom: '12px' }}>
              📋 DOCUMENTS REQUIRED AT RESUMPTION
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {admissions.requirements.map((req, i) => (
                <li key={i} style={{ fontSize: '14px', color: template.colors.text, marginBottom: '4px' }}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div style={{
          backgroundColor: template.colors.surface,
          borderRadius: '16px',
          border: `1px solid ${template.colors.border}`,
          overflow: 'hidden',
        }}>
          {/* Student section */}
          <div style={{ padding: '32px 40px', borderBottom: `1px solid ${template.colors.border}` }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px', fontWeight: 700,
              color: template.colors.primary, marginBottom: '24px',
            }}>
              Student Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <Field label="First Name" field="studentFirstName" required placeholder="e.g. Chukwuemeka" />
              <Field label="Last Name" field="studentLastName" required placeholder="e.g. Okafor" />
              <Field label="Date of Birth" field="studentDob" type="date" required />
              <Field label="Gender" field="studentGender" required
                options={['Male', 'Female']}
              />
              <Field label="Class Applying For" field="classApplyingFor" required
                options={admissions.availableClasses}
              />
              <Field label="Previous School (if any)" field="previousSchool"
                placeholder="Name of previous school" />
            </div>
          </div>

          {/* Parent section */}
          <div style={{ padding: '32px 40px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px', fontWeight: 700,
              color: template.colors.primary, marginBottom: '24px',
            }}>
              Parent / Guardian Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <Field label="Full Name" field="parentName" required placeholder="e.g. Mrs. Ngozi Okafor" />
              <Field label="Relationship to Student" field="parentRelationship" required
                options={['Father', 'Mother', 'Guardian', 'Other']}
              />
              <Field label="Phone Number" field="parentPhone" type="tel" required placeholder="+234 801 234 5678" />
              <Field label="Email Address" field="parentEmail" type="email" required placeholder="parent@email.com" />
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Residential Address" field="parentAddress" required placeholder="Full address including city and state" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{
            padding: '24px 40px',
            backgroundColor: template.colors.background,
            borderTop: `1px solid ${template.colors.border}`,
          }}>
            {admissions.requiresPayment && admissions.applicationFeeNaira > 0 && (
              <p style={{
                fontSize: '14px', color: template.colors.textLight,
                marginBottom: '20px', lineHeight: 1.6,
              }}>
                ℹ️ After filling this form, you will be directed to Paystack to pay the{' '}
                <strong>₦{admissions.applicationFeeNaira.toLocaleString('en-NG')} application fee</strong> securely online.
                Your application will be submitted once payment is confirmed.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '10px',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                fontWeight: 700,
                backgroundColor: isSubmitting ? template.colors.textLight : template.colors.primary,
                color: '#FFFFFF',
                transition: 'all 0.15s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Processing...'
                : admissions.requiresPayment && admissions.applicationFeeNaira > 0
                  ? `Submit Application & Pay ₦${admissions.applicationFeeNaira.toLocaleString('en-NG')}`
                  : 'Submit Application'
              }
            </button>

            <p style={{ fontSize: '12px', color: template.colors.textLight, textAlign: 'center', marginTop: '12px' }}>
              🔒 Your information is secure. Payments processed by Paystack.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
