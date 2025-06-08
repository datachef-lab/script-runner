import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./components/layouts/root-layout";
import {
  CollegeApprovalScriptPage,
  CombineMarksColumnScriptPage,
  DownloadMarksheetFilesScriptPage,
  MarksUploadScriptPage,
  RootPage,
  WebScrapeMarksScriptPage,
} from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "", element: <RootPage /> },
      { path: "/college-approval", element: <CollegeApprovalScriptPage /> },
      { path: "/combine-marks", element: <CombineMarksColumnScriptPage /> },
      {
        path: "/download-marksheets",
        element: <DownloadMarksheetFilesScriptPage />,
      },
      { path: "/webscrape-marks", element: <WebScrapeMarksScriptPage /> },
      { path: "/marks-verification", element: <MarksUploadScriptPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
