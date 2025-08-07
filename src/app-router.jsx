/* ************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2024 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

import React from "react";
import { Route, Routes } from "react-router-dom";
import Landing from "./views/landing";
import Result from "./views/result";
import Upload from "./views/upload";
import Info from "./views/info";

const AppRouter = () => {

  const basename = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/"));

  return (
    <Routes>
      <Route path={`${basename}/`} element={<Landing />} />
      <Route path={`${basename}/upload/`} element={<Upload />} />
      <Route exact path={`${basename}/result/`} element={<Result />} />
      <Route path={`${basename}/info/`} element={<Info />} />
    </Routes>
  );
};

export default AppRouter;
