import {Suspense} from "react";
import Katalog from "@/components/Katalog";
import Skeleton from "@/components/Skeleton";
export const dynamic="force-dynamic";
export default function HalamanKatalog(props){return <Suspense fallback={<Skeleton/>}><Katalog {...props}/></Suspense>;}
