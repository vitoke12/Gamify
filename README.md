# Gamify

Tu progreso real, contado como un RPG. Registras lo que haces de verdad
(entrenar, leer, llamar a un amigo, ahorrar) y la app lo convierte en XP,
niveles, árboles de habilidades y misiones.

Un solo usuario: tú. En español.

---

## Ponerla en marcha

```bash
npm install
npm run db:push      # crea prisma/dev.db con el esquema
npm run db:seed      # vuelca las reglas de /config a la base
npm run dev          # http://localhost:3000
```

`npm run db:seed` es idempotente: se puede relanzar cada vez que cambien las
reglas del juego sin perder tu historial.

| Comando | Para qué |
|---|---|
| `npm run dev` | desarrollo, solo en este ordenador |
| `npm run dev:lan` | igual, pero accesible desde el móvil por la wifi |
| `npm run build && npm run start:lan` | versión rápida, accesible por la wifi |
| `npm test` | los tests del dominio |
| `npm run db:studio` | mirar la base a mano |
| `/api/exportar` | descarga todos tus datos en un JSON |

---

## Usarla desde el móvil

### Por la wifi de casa (el PC tiene que estar encendido)

1. `npm run dev:lan`
2. Mira la IP de tu PC: `ipconfig` → *Dirección IPv4*, algo como `192.168.1.40`
3. En el móvil, con la misma wifi: `http://192.168.1.40:3000`

### Instalada como app

Con la app abierta en el móvil: menú del navegador → **Añadir a pantalla de
inicio**. A partir de ahí tiene su icono, se abre a pantalla completa y las
pantallas que ya has visitado funcionan sin cobertura.

### Sin conexión

- **Leer** funciona siempre: el service worker guarda lo último que viste.
- **Registrar** también: si no hay red, la sesión se guarda en el móvil con su
  hora real y se sube sola en cuanto vuelva la conexión. La XP se calcula al
  subirla, no antes, porque depende del día entero.

---

## Desplegarla (para no depender de tener el PC encendido)

El esquema es SQLite a los dos lados, así que desplegar **no cambia ni una
línea del modelo de datos**. Hacen falta dos piezas, las dos con plan gratuito:

- **Turso** aloja la base (es SQLite alojado).
- **Vercel** sirve la app.

### 1. La base

```bash
npm i -g @tursodatabase/turso-cli    # o el instalador de su web
turso auth signup
turso db create gamify
turso db show gamify --url           # -> TURSO_DATABASE_URL
turso db tokens create gamify        # -> TURSO_AUTH_TOKEN
```

Para llevarte lo que ya tienes en local:

```bash
sqlite3 prisma/dev.db .dump > copia.sql
turso db shell gamify < copia.sql
```

Si prefieres empezar de cero, salta el volcado y luego siembra:
`TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:seed`.

### 2. La app

```bash
npm i -g vercel
vercel                                # enlaza el proyecto
vercel env add TURSO_DATABASE_URL     # pega la url
vercel env add TURSO_AUTH_TOKEN       # pega el token
vercel --prod
```

Vercel te da una url tipo `https://gamify-algo.vercel.app`. Ábrela en el móvil
y añádela a la pantalla de inicio: ya no necesitas el ordenador para nada.

**Cómo elige la base:** si existe `TURSO_DATABASE_URL`, la app se conecta ahí;
si no, usa el archivo local. Está en [`src/lib/db/prisma.ts`](src/lib/db/prisma.ts).

**Lo que cambia al desplegar:** tus datos pasan a estar en un servidor ajeno en
vez de en tu disco. Es el precio de que funcione con el ordenador apagado.

---

## Cómo está montada

```
config/     las reglas del juego COMO DATOS: economía, categorías, árboles,
            actividades, misiones, logros, clases. Cambiar el equilibrio no
            debería tocar ni lógica ni UI.
src/lib/domain/   funciones puras, sin React ni Prisma. Aquí está el motor de
                  XP, la curva, el árbol, las rachas, las clases. 172 tests.
src/lib/db/       traduce filas de Prisma a los tipos del dominio. Es la única
                  capa que sabe que existe una base de datos.
src/lib/actions/  server actions: envuelven /lib/db y revalidan.
src/app/          las pantallas.
```

Tres invariantes que sostienen el resto:

1. **El registro es un log inmutable.** Nunca se guarda un total mutable; XP,
   niveles y puntos se derivan de `XpEntry`. Por eso se puede cambiar la
   fórmula y recalcular el historial.
2. **El día empieza a las 05:00**, no a medianoche. Racha, topes y misiones
   usan ese corte.
3. **El techo diario de XP es el mismo en las diez categorías** (540). Lo
   comprueba `validarConfig()`: si alguien toca un número y lo rompe, el seed
   revienta en vez de desequilibrar el juego en silencio.
