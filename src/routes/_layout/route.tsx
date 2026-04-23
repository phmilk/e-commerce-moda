import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Header } from '#/components/Layout'

export const Route = createFileRoute('/_layout')({
  component: Layout,
})

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
