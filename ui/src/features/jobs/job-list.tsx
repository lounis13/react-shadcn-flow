import useGetJobs from "./api/queries.ts";
import {Button} from "@/components/ui/button.tsx";
import {AlertCircle, RefreshCw} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card.tsx";
import {Link} from "@tanstack/react-router";

export function JobList() {
    const {data, isLoading, error, refetch, isRefetching} = useGetJobs({refetchInterval: 30_000})

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error loading runs</AlertTitle>
                <AlertDescription>
                    {error.detail || 'Failed to fetch jobs. Please try again.'}
                </AlertDescription>
            </Alert>
        );
    }
    if (isLoading) return (
        <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    )

    return <div className="grid gap-4">
        <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
        >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`}/>
            Refresh
        </Button>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {
                data?.map(job => <li key={job.id}>
                    <Link to={"/jobs/$jobId" as const} params={{jobId: job.id}} className="block">
                        <Card className="shadow-none hover:shadow-sm cursor-pointer">
                            <CardHeader>{job.id}</CardHeader>
                            <CardContent>
                                {job.status}
                            </CardContent>
                            <CardFooter>

                            </CardFooter>
                        </Card>
                    </Link>
                </li>)
            }
        </ul>
    </div>
}