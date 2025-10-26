import { DashboardTotalCountCard, DealsChart, LatestActivities, UpcomingEvents } from "@/components";
import { DASHBOARD_TOTAL_COUNTS_QUERY } from "@/graphql/queries";
import { DashboardTotalCountsQuery } from "@/graphql/types";
import { useCustom, useApiUrl } from "@refinedev/core";
import { Col, Row } from "antd";

export const Home = () => {
  const apiUrl = useApiUrl();                 // ✅ no process.env
  const url = `${apiUrl}/graphql`;   

  const { query } = useCustom<DashboardTotalCountsQuery>({
    url,         // ✅ point to your GraphQL endpoint
    method: "post",        // ✅ GraphQL is typically POST
    meta: { gqlQuery: DASHBOARD_TOTAL_COUNTS_QUERY },
  });

  const isLoading = query.isLoading;               // ✅ from query
  const totals = query.data?.data;                 // ✅ response payload

  return (
    <div>
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="companies"
            isLoading={isLoading}
            totalCount={totals?.companies?.totalCount}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="contacts"
            isLoading={isLoading}
            totalCount={totals?.contacts?.totalCount}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="deals"
            isLoading={isLoading}
            totalCount={totals?.deals?.totalCount}
          />
        </Col>
      </Row>

      <Row gutter={[32, 32]} style={{ marginTop: "32px" }}>
        <Col xs={24} sm={24} xl={8} style={{ height: "460px" }}>
          <UpcomingEvents />
        </Col>
        <Col xs={24} sm={24} xl={16} style={{ height: "460px" }}>
          <DealsChart />
        </Col>
      </Row>

      <Row gutter={[32, 32]} style={{ marginTop: "32px" }}>
        <Col xs={24}>
          <LatestActivities />
        </Col>
      </Row>
    </div>
  );
};
