import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'

export default function AccountPage() {
  const { data: me } = useMe()
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Cuenta</h1>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium">{me?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Correo</p>
            <p className="font-medium break-all">{me?.email}</p>
          </div>
        </CardContent>
      </Card>
      <Button variant="secondary" onClick={() => void signOut()}>
        Cerrar sesión
      </Button>
    </div>
  )
}
