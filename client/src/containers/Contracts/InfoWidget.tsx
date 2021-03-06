/*
 * Lean tool - hypothesis testing application
 *
 * https://github.com/MikaelLazarev/lean-tool/
 * Copyright (c) 2020. Mikhail Lazarev
 *
 */

import React, {useEffect, useState} from "react";
import {Contract, ContractManager} from "../../core/contract";
import {Button, Card, Col, Row, Table} from "react-bootstrap";
import { ContractMarkdown } from "../../components/ContractMarkdown/ContractMarkdown";
import {toHumanDate} from "../../utils/formaters";
import {useDispatch, useSelector} from "react-redux";
import {useHistory} from "react-router";
import actions from "../../store/actions";
import {RootState} from "../../store";
import {STATUS} from "../../utils/status";

interface InfoWidgetProps {
  data: Contract;
}

export const InfoWidget: React.FC<InfoWidgetProps> = ({ data }) => {

  const contractManager = new ContractManager(data);

  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(actions.near.getAccount());
  });

  const [hash, setHash] = useState("0");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const accountID = useSelector((state: RootState) => state.near.accountId);

  const operationStatus = useSelector(
      (state: RootState) => state.operations.data[hash]?.data?.status
  );

  // TODO: Move status to new Dataloader component

  useEffect(() => {
    if (hash !== "0") {
      switch (operationStatus) {
        case STATUS.SUCCESS:
          break;

        case STATUS.FAILURE:
          setHash("0");
          setIsSubmitted(false);
          alert("Cant submit your operation to server");
      }
    }
  }, [hash, operationStatus]);

  if (accountID === undefined) {
    return <div>Cant get Account ID</div>
  }

  const onDeploy = () => {
    setIsSubmitted(true);
    const newHash = Date.now().toString();
    setHash(newHash);

    // Emit data
    dispatch(actions.contracts.deployContract(data, newHash));
  };

  const onSign = () => {
    setIsSubmitted(true);
    const newHash = Date.now().toString();
    setHash(newHash);

    if (contractManager.isOwner(accountID)) {
      dispatch(actions.contracts.signByOwner(data, newHash));
    }

    if (contractManager.isPartner(accountID)) {
      dispatch(actions.contracts.signByPartner(data, newHash));
    }
    // Emit data

  };

  let nextAction;

  if (contractManager.status === 'Draft') {
    nextAction = data.isIOwner ? <Button onClick={onDeploy} disabled={isSubmitted}>
      Deploy
    </Button> : <strong>Waiting for deployment by owner</strong>
  }

  if (contractManager.status === 'Deployed' && contractManager.couldBeSignedByMe(accountID)) {
    nextAction =  <Button onClick={onSign} disabled={isSubmitted}>
      Sign
    </Button>
  }

  return (
    <Row style={{ marginTop: "20px" }}>
      <Col lg={8} md={8} xs={12}>
        <ContractMarkdown source={data.content} />
      </Col>
      <Col lg={4} md={4} xs={12}>
        <Card>
          <Card.Header className="card-header" style={{backgroundColor: '#F0F0F0'}}>
            <h6 className="mg-b-0" >Info</h6>
          </Card.Header>
          <Card.Body className="pd-20">
            <div className="table-responsive">
              Date: {toHumanDate(data.date)}
              <br />
              Owner: {data.owner?.name}
              <br />
              Partner: {data.partner?.name}
              <br />
              Agreement ID: {data.isDeployed ? data.address : "Not deployed yet."}
              <br />
              Status: {contractManager.status}
              <br />
              Signed by owner: { contractManager.signedByOwner || '' }
              <br />
              Signed by partner: { contractManager.signedByPartner || ''}
              <br />
              <br />
            </div>

            {nextAction}


          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
