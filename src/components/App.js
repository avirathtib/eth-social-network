import React, { Component } from "react";
import Web3 from "web3";
import logo from "../logo.png";
import "./App.css";
import SocialNetwork from "../abis/SocialNetwork.json";
import Navbar from "./Navbar";
import Identicon from "identicon.js";

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying Metamask."
      );
    }
  }
  async loadBlockchainData() {
    const web3 = window.web3;
    //Load account
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();
    const networkData = SocialNetwork.networks[networkId];
    if (SocialNetwork.networks[networkId]) {
      const socialNetwork = web3.eth.Contract(
        SocialNetwork.abi,
        networkData.address
      );
      this.setState({ socialNetwork });
      const postCount = await socialNetwork.methods.postCount().call();
      console.log(postCount);
      this.setState({ postCount });
      for (var i = 0; i < postCount; i++) {
        const post = await socialNetwork.methods.posts(i).call();
        console.log(post);
        this.setState({
          posts: [...this.state.posts, post],
        });
      }
      console.log({ posts: this.state.posts });
    } else {
      window.alert("SocialNetwork contract not deployed to detected network");
    }
  }

  createPost(content) {
    this.state.socialNetwork.methods
      .createPost(content)
      .send({ from: this.state.account })
      .once("receipt", (receipt) => {
        console.log("Loaded Baby");
      });
  }

  tipPost(id, tipAmount) {
    this.state.socialNetwork.methods
      .tipPost(id)
      .send({ from: this.state.account, value: tipAmount })
      .once("receipt", (receipt) => {
        console.log("tipped");
      });
  }

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      socialNetwork: null,
      postCount: 0,
      posts: [],
    };
  }
  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 d-flex text-center"
              style={{ maxWidth: "500px" }}
            >
              <div className="content mr-auto ml-auto">
                <p>&nbsp;</p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const content = this.postContent.value;
                    this.createPost(content);
                  }}
                >
                  <div className="form-group mr-sm-2">
                    <input
                      id="postContent"
                      type="text"
                      ref={(input) => {
                        this.postContent = input;
                      }}
                      className="form-control"
                      placeholder="What's on your mind?"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    Share
                  </button>
                </form>
                <p>&nbsp;</p>
                {this.state.posts.map((post, key) => {
                  return (
                    <div className="card mb-4" key={key}>
                      <div className="card-header">
                        <img
                          className="mr-2"
                          width="30"
                          height="30"
                          src={`data:image/png;base64,${new Identicon(
                            post.author,
                            30
                          ).toString()}`}
                        />
                        <small className="text-muted">{post.author}</small>
                      </div>
                      <ul id="postList" className="list-group list-group-flush">
                        <li className="list-group-item">
                          <p>{post.content}</p>
                        </li>
                        <li key={key} className="list-group-item py-2">
                          <small className="float-left mt-1 text-muted">
                            TIPS:
                            {window.web3.utils.fromWei(
                              post.tipAmount.toString(),
                              "Ether"
                            )}
                            ETH
                          </small>
                          <button
                            name={post.id}
                            onClick={(event) => {
                              let tipAmount = window.web3.utils.toWei(
                                "0.1",
                                "Ether"
                              );
                              console.log(event.target.name, tipAmount);
                              this.tipPost(event.target.name, tipAmount);
                            }}
                            className="btn btn-link btn-sm float-right pt-0"
                          >
                            TIP 0.1 ETH
                          </button>
                        </li>
                      </ul>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
