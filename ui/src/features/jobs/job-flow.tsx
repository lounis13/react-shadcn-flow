import {useGetJob} from "@/features/jobs/api";
import {Route} from "@/routes/jobs.$jobId.tsx";

export function JobFlow() {

    const {jobId} = Route.useParams();
    const {data, isLoading, error} = useGetJob(jobId, {
        refetchInterval: 10000,
    });

    if (!data || isLoading)
        return <div>Loading...</div>

    return <div>
        {data.id} {data.status}
    </div>
}