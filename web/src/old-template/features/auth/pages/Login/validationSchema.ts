import { TFunction } from 'i18next';
import * as yup from 'yup';

export const loginSchema = (t: TFunction<[string]>) =>
  yup.object().shape({
    email: yup.string().email(t('forms.validation.email')).required(t('forms.validation.required.email')),
    password: yup.string().required(t('forms.validation.required.password')),
  });
