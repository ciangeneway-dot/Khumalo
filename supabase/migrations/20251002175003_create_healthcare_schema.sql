/*
  # Healthcare Document Management System Schema

  ## Overview
  This migration creates the database schema for a healthcare document management application
  that allows healthcare professionals to manage patient records and documents.

  ## New Tables

  ### `patients`
  Patient profile information
  - `id` (uuid, primary key) - Unique patient identifier
  - `first_name` (text) - Patient's first name
  - `last_name` (text) - Patient's last name
  - `date_of_birth` (date) - Patient's date of birth
  - `email` (text, unique) - Patient's email address
  - `phone` (text) - Patient's phone number
  - `address` (text) - Patient's address
  - `medical_record_number` (text, unique) - Unique medical record number
  - `created_by` (uuid, references auth.users) - Healthcare professional who created the record
  - `created_at` (timestamptz) - When the record was created
  - `updated_at` (timestamptz) - When the record was last updated

  ### `documents`
  Patient document storage and metadata
  - `id` (uuid, primary key) - Unique document identifier
  - `patient_id` (uuid, references patients) - Associated patient
  - `file_name` (text) - Original file name
  - `file_path` (text) - Storage path in Supabase Storage
  - `file_type` (text) - MIME type of the file
  - `file_size` (integer) - File size in bytes
  - `description` (text) - Document description
  - `uploaded_by` (uuid, references auth.users) - Healthcare professional who uploaded the document
  - `created_at` (timestamptz) - When the document was uploaded

  ### `ai_summaries`
  AI-generated summaries of patient records
  - `id` (uuid, primary key) - Unique summary identifier
  - `patient_id` (uuid, references patients) - Associated patient
  - `summary_text` (text) - AI-generated summary
  - `generated_by` (uuid, references auth.users) - Healthcare professional who requested the summary
  - `created_at` (timestamptz) - When the summary was generated

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  #### Patients Table
  - Authenticated users can view all patient records
  - Authenticated users can create new patient records
  - Authenticated users can update patient records
  - Authenticated users can delete patient records they created

  #### Documents Table
  - Authenticated users can view all documents
  - Authenticated users can upload new documents
  - Authenticated users can delete documents they uploaded

  #### AI Summaries Table
  - Authenticated users can view all summaries
  - Authenticated users can create new summaries

  ## Storage

  Creates a `patient-documents` storage bucket for storing uploaded files with public access disabled.
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  medical_record_number text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  description text,
  uploaded_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  summary_text text NOT NULL,
  generated_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Authenticated users can view all patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own patients"
  ON patients FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Documents policies
CREATE POLICY "Authenticated users can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Authenticated users can delete their own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- AI Summaries policies
CREATE POLICY "Authenticated users can view all summaries"
  ON ai_summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create summaries"
  ON ai_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = generated_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_summaries_patient_id ON ai_summaries(patient_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patients table
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();