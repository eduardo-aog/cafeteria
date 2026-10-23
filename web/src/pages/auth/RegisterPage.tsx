import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell, FieldError } from '@/components/AuthShell'
import { api, ApiError } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Escribe tu nombre.').max(100, 'El nombre es muy largo.'),
    email: z.email('Escribe un correo válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })
type Values = z.infer<typeof schema>

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ name, email, password }: Values) => {
    const normalized = email.trim().toLowerCase()
    try {
      // El servidor solo recibe la contraseña, sin la confirmación.
      await api('/auth/register', { method: 'POST', body: { name, email: normalized, password } })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.')
      return
    }
    // Al iniciar sesión, GuestOnly redirige al menú.
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password })
    if (error)
      toast.error(
        'Tu cuenta se creó, pero no se pudo iniciar sesión. Entra desde «Iniciar sesión».',
      )
  }

  return (
    <AuthShell title="Crear cuenta">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  )
}
