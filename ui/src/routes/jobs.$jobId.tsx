import {createFileRoute} from '@tanstack/react-router';
import {JobFlow} from "@/features/jobs/job-flow.tsx";

export const Route = createFileRoute('/jobs/$jobId')({
    component: RunDetailPage,
});

function RunDetailPage() {
    return <JobFlow/>;
}
