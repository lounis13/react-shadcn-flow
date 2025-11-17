import {createFileRoute} from '@tanstack/react-router';
import {JobList} from "@/features/jobs/job-list.tsx";

export const Route = createFileRoute('/jobs/')({
    component: RunsPage,
});

function RunsPage() {
    return <JobList/>;
}
