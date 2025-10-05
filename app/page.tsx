import WhackAMole from "@/components/whack-a-mole"

export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col items-center">
      
      <header className="w-full max-w-md px-6 pt-8">
        <h1 className="text-2xl font-semibold text-pretty">Whack-a-Mole</h1>
        <p className="text-sm text-muted-foreground mt-1">Tap the glowing tile to score points before time runs out.</p>
      </header>

      <section className="w-full max-w-md p-6">
        <WhackAMole />
      </section>

      <footer className="w-full max-w-md px-6 pb-10 text-xs text-muted-foreground">
        <p className="mt-4">High score is saved locally on your device.</p>
      </footer>
    </main>
  )
}
