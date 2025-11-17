import {useGetJob} from "@/features/jobs/api";
import {Route} from "@/routes/jobs.$jobId.tsx";
import {FlowGraph} from "./components/FlowGraph";

export function JobFlow() {

    const {jobId} = Route.useParams();
    const {data, isLoading, error} = useGetJob(jobId, {
        refetchInterval: 100,
    });

    if (error)
        return <div>error</div>
    if (!data || isLoading)
        return <div>Loading...</div>

    return <FlowGraph job={data}/>
}