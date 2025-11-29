/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { memo } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useUserContext } from '@/context/UserContext';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { paths } from '@/old-template/common/constants';

import { useAuthActions } from '../../api';
import { AuthLayout } from '../../components';
import { LoginPayload } from '../../types';
import { loginSchema } from './validationSchema';

const LOGIN_DEFAULT_VALUES = { email: '', password: '' };

const Login = () => {
  const { t } = useTranslation(['login']);
  const navigate = useNavigate();
  const userContext = useUserContext();

  const form = useForm<LoginPayload>({
    defaultValues: LOGIN_DEFAULT_VALUES,
    resolver: yupResolver(loginSchema(t)),
  });

  const { login, updateUserContext } = useAuthActions();

  const onLogin = (data: LoginPayload) => {
    void login
      .mutateAsync(data)
      .then(() => updateUserContext(userContext!.setUser))
      .then(() => navigate(paths.DASHBOARD));
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[257px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold text-left text-[#7AB2B2]">{t('title')}</h1>
          <p className="text-[1em] leading-1.5 text-left text-gray-600">{t('subtitle')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="h-14" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" className="h-14" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={!form.formState.isDirty}
              type="submit"
              className="w-full h-12 bg-[#7AB2B2] hover:bg-[#4D869C] text-white uppercase tracking-wider"
            >
              {t('signIn')}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default memo(Login);
