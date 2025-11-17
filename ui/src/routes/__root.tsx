import {createRootRoute, Outlet, useRouterState} from '@tanstack/react-router'
import {TanStackRouterDevtoolsPanel} from '@tanstack/react-router-devtools'
import {TanStackDevtools} from '@tanstack/react-devtools'

import {AppSidebar} from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {Separator} from "@/components/ui/separator"
import {SidebarInset, SidebarProvider, SidebarTrigger,} from "@/components/ui/sidebar"

function RootLayout() {
    const routerState = useRouterState();
    const pathname = routerState.location.pathname;

    // Simple breadcrumb logic
    const getBreadcrumbs = () => {
        if (pathname === '/runs') {
            return {
                parent: 'Night Batch',
                current: 'Runs',
            };
        }
        if (pathname.startsWith('/runs/') && pathname !== '/runs') {
            return {
                parent: 'Night Batch',
                parentLink: '/runs',
                current: 'Run Details',
            };
        }
        return {
            parent: 'Night Batch',
            current: 'Home',
        };
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <>
            <SidebarProvider>
                <AppSidebar/>
                <SidebarInset>
                    <header
                        className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1"/>
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        {breadcrumbs.parentLink ? (
                                            <BreadcrumbLink href={breadcrumbs.parentLink}>
                                                {breadcrumbs.parent}
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbLink href="#">
                                                {breadcrumbs.parent}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block"/>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{breadcrumbs.current}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <Outlet/>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            <TanStackDevtools
                config={{
                    position: 'bottom-right',
                }}
                plugins={[
                    {
                        name: 'Tanstack Router',
                        render: <TanStackRouterDevtoolsPanel/>,
                    },
                ]}
            />
        </>
    );
}

export const Route = createRootRoute({
    component: RootLayout,
})
