import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/identity';

// Import mock declarations for development
import { canisterId as studentCanisterId, idlFactory as studentIdlFactory } from '../declarations/student_canister';
import { canisterId as courseCanisterId, idlFactory as courseIdlFactory } from '../declarations/course_canister';
import { canisterId as tokenCanisterId, idlFactory as tokenIdlFactory } from '../declarations/token_canister';
import { canisterId as peerCanisterId, idlFactory as peerIdlFactory } from '../declarations/peer_canister';

const host = import.meta.env.VITE_DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app';

class AgentService {
  private agent: HttpAgent | null = null;
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private studentActor: any = null;
  private courseActor: any = null;
  private tokenActor: any = null;
  private peerActor: any = null;

  async init() {
    this.authClient = await AuthClient.create();
    this.identity = this.authClient.getIdentity();
    
    this.agent = new HttpAgent({
      host,
      identity: this.identity,
    });

    if (import.meta.env.VITE_DFX_NETWORK === 'local') {
      await this.agent.fetchRootKey();
    }

    this.createActors();
  }

  private createActors() {
    // For development, use mock implementations
    this.studentActor = {
      create_student_profile: async (name: string, email: string, bio: string) => {
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          email,
          bio,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in localStorage for persistence
        const existingProfiles = JSON.parse(localStorage.getItem('studentProfiles') || '{}');
        existingProfiles[profile.principal] = profile;
        localStorage.setItem('studentProfiles', JSON.stringify(existingProfiles));
        
        return profile;
      },
      get_student_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingProfiles = JSON.parse(localStorage.getItem('studentProfiles') || '{}');
        return existingProfiles[principal] || null;
      },
      enroll_in_course: async (courseId: string) => {
        const enrollment = {
          student_id: this.identity?.getPrincipal().toText() || 'mock-principal',
          course_id: courseId,
          enrolled_at: Date.now() * 1000000,
          progress: [],
          completed: false,
          completed_at: null
        };
        
        // Store enrollment
        const existingEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        existingEnrollments.push(enrollment);
        localStorage.setItem('enrollments', JSON.stringify(existingEnrollments));
        
        return enrollment;
      },
      get_student_enrollments: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        return existingEnrollments.filter((e: any) => e.student_id === principal);
      },
      get_student_certificates: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        return existingCertificates.filter((c: any) => c.student_id === principal);
      },
      mark_section_complete: async (courseId: string, sectionId: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        
        // Find the enrollment for this course and user
        const enrollmentIndex = existingEnrollments.findIndex((e: any) => 
          e.student_id === principal && e.course_id === courseId
        );
        
        if (enrollmentIndex !== -1) {
          // Add section to progress if not already there
          if (!existingEnrollments[enrollmentIndex].progress.includes(sectionId)) {
            existingEnrollments[enrollmentIndex].progress.push(sectionId);
          }
          
          // Save back to localStorage
          localStorage.setItem('enrollments', JSON.stringify(existingEnrollments));
          
          return existingEnrollments[enrollmentIndex];
        }
        
        throw new Error('Enrollment not found');
      },
      complete_course: async (courseId: string, courseTitle: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        
        // Find and update the enrollment
        const enrollmentIndex = existingEnrollments.findIndex((e: any) => 
          e.student_id === principal && e.course_id === courseId
        );
        
        if (enrollmentIndex !== -1) {
          existingEnrollments[enrollmentIndex].completed = true;
          existingEnrollments[enrollmentIndex].completed_at = Date.now() * 1000000;
          localStorage.setItem('enrollments', JSON.stringify(existingEnrollments));
        }
        
        // Create a certificate
        const certificate = {
          certificate_id: Math.random().toString(36).substr(2, 9),
          student_id: principal,
          course_id: courseId,
          course_title: courseTitle,
          issued_at: Date.now() * 1000000
        };
        
        // Store certificate
        const existingCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        existingCertificates.push(certificate);
        localStorage.setItem('certificates', JSON.stringify(existingCertificates));
        
        return certificate;
      }
    };

    this.courseActor = {
      create_educator_profile: async (name: string, bio: string, expertise: string[]) => {
        // Simulate successful profile creation
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          bio,
          expertise,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in localStorage for persistence
        const existingProfiles = JSON.parse(localStorage.getItem('educatorProfiles') || '{}');
        existingProfiles[profile.principal] = profile;
        localStorage.setItem('educatorProfiles', JSON.stringify(existingProfiles));
        
        return profile;
      },
      get_educator_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingProfiles = JSON.parse(localStorage.getItem('educatorProfiles') || '{}');
        return existingProfiles[principal] || null;
      },
      create_course: async (title: string, description: string, token_reward: number) => {
        const course = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          description,
          educator_id: this.identity?.getPrincipal().toText() || 'mock-educator',
          sections: [],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          published: false,
          token_reward
        };
        
        // Store course
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        existingCourses.push(course);
        localStorage.setItem('courses', JSON.stringify(existingCourses));
        
        return course;
      },
      get_educator_courses: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        return existingCourses.filter((c: any) => c.educator_id === principal);
      },
      get_published_courses: async () => {
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const publishedCourses = existingCourses.filter((c: any) => c.published);
        
        // If no courses exist, return some default ones
        if (publishedCourses.length === 0) {
          return [
            {
              id: "course1",
              title: "Introduction to Blockchain",
              description: "Master the fundamentals of blockchain technology, cryptocurrency, and distributed systems. This comprehensive course covers everything from basic concepts to advanced implementations.",
              educator_id: "prof-rajesh-kumar",
              educator_name: "Prof. Rajesh Kumar",
              institution: "IIT Bombay - Computer Science & Engineering",
              difficulty: "Beginner",
              duration: "6 weeks",
              rating: 4.8,
              enrolled_count: 1247,
              sections: [
                {
                  id: "intro-blockchain",
                  title: "What is Blockchain?",
                  content: `Welcome to the fascinating world of blockchain technology!

## Understanding Blockchain

Blockchain is a revolutionary technology that serves as a distributed ledger, maintaining a continuously growing list of records (blocks) that are linked and secured using cryptography. Think of it as a digital ledger that's shared across multiple computers, making it nearly impossible to hack or manipulate.

### Key Characteristics:

1. **Decentralization**: No single point of control
2. **Transparency**: All transactions are visible to network participants
3. **Immutability**: Once data is recorded, it's extremely difficult to change
4. **Security**: Cryptographic hashing ensures data integrity

### Real-World Applications:

- **Cryptocurrency**: Bitcoin, Ethereum, and other digital currencies
- **Supply Chain**: Tracking products from manufacture to consumer
- **Healthcare**: Secure patient record management
- **Voting Systems**: Transparent and tamper-proof elections
- **Real Estate**: Property ownership and transfer records

### How Blockchain Works:

1. **Transaction Initiation**: A user initiates a transaction
2. **Broadcasting**: The transaction is broadcast to the network
3. **Validation**: Network nodes validate the transaction
4. **Block Creation**: Valid transactions are bundled into a block
5. **Consensus**: The network agrees on the new block
6. **Addition**: The block is added to the chain

This process ensures that every transaction is verified by multiple parties, creating a trustless system where participants don't need to know or trust each other.

### Why Blockchain Matters:

Blockchain technology addresses fundamental issues in digital transactions:
- **Double Spending**: Prevents the same digital asset from being spent twice
- **Trust**: Eliminates the need for intermediaries
- **Censorship Resistance**: No single entity can block transactions
- **Global Access**: Available 24/7 worldwide

In the next section, we'll dive deeper into the cryptographic foundations that make blockchain secure and reliable.`,
                  order: 0
                },
                {
                  id: "crypto-foundations",
                  title: "Cryptographic Foundations",
                  content: `Understanding the cryptographic principles that secure blockchain networks.

## Hash Functions

Hash functions are mathematical algorithms that convert input data of any size into a fixed-size string of characters. In blockchain, we primarily use SHA-256 (Secure Hash Algorithm 256-bit).

### Properties of Cryptographic Hash Functions:

1. **Deterministic**: Same input always produces same output
2. **Fixed Output Size**: Always 256 bits for SHA-256
3. **Avalanche Effect**: Small input change drastically changes output
4. **One-Way Function**: Computationally infeasible to reverse
5. **Collision Resistant**: Nearly impossible to find two inputs with same output

### Example:
Input: "Hello, Blockchain!"
SHA-256 Output: 7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730

Input: "Hello, Blockchain?"
SHA-256 Output: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4

Notice how changing just one character completely changes the hash!

## Digital Signatures

Digital signatures provide authentication and non-repudiation in blockchain transactions.

### How Digital Signatures Work:

1. **Key Generation**: Create a public-private key pair
2. **Signing**: Use private key to sign transaction data
3. **Verification**: Others use public key to verify signature

### Benefits:
- **Authentication**: Proves who sent the transaction
- **Integrity**: Ensures data hasn't been tampered with
- **Non-repudiation**: Sender can't deny sending the transaction

## Merkle Trees

Merkle trees efficiently summarize all transactions in a block using a binary tree structure.

### Structure:
- **Leaf Nodes**: Individual transaction hashes
- **Internal Nodes**: Hash of two child nodes
- **Root**: Single hash representing entire block

### Advantages:
- **Efficient Verification**: Verify any transaction with log(n) hashes
- **Tamper Detection**: Any change invalidates the root hash
- **Scalability**: Handle millions of transactions efficiently

These cryptographic tools work together to create the security foundation that makes blockchain technology trustworthy and reliable.`,
                  order: 1
                },
                {
                  id: "consensus-mechanisms",
                  title: "Consensus Mechanisms",
                  content: `Learn how blockchain networks reach agreement without central authority.

## What is Consensus?

Consensus mechanisms are protocols that ensure all nodes in a blockchain network agree on the current state of the ledger. They solve the fundamental problem of achieving agreement in a distributed system.

## Proof of Work (PoW)

Used by Bitcoin and Ethereum (until 2022), PoW requires miners to solve computationally expensive puzzles.

### How PoW Works:

1. **Transaction Collection**: Miners gather pending transactions
2. **Block Creation**: Form a candidate block with transactions
3. **Puzzle Solving**: Find a nonce that makes block hash meet difficulty target
4. **Broadcasting**: Share the solution with the network
5. **Verification**: Other nodes verify and accept the block

### Advantages:
- **Security**: Extremely secure due to computational cost
- **Decentralization**: Anyone can participate as a miner
- **Proven Track Record**: Successfully securing Bitcoin since 2009

### Disadvantages:
- **Energy Consumption**: Requires massive computational power
- **Scalability**: Limited transaction throughput
- **Environmental Impact**: High electricity usage

## Proof of Stake (PoS)

Validators are chosen to create blocks based on their stake (ownership) in the network.

### How PoS Works:

1. **Staking**: Validators lock up tokens as collateral
2. **Selection**: Algorithm chooses validator based on stake and randomness
3. **Block Proposal**: Selected validator creates new block
4. **Attestation**: Other validators vote on the block's validity
5. **Finalization**: Block is added if it receives enough votes

### Advantages:
- **Energy Efficient**: No computational puzzles to solve
- **Scalability**: Faster transaction processing
- **Economic Security**: Validators lose stake for malicious behavior

### Disadvantages:
- **Wealth Concentration**: Rich validators get richer
- **Nothing at Stake**: Theoretical attack vector
- **Complexity**: More complex protocol design

## Other Consensus Mechanisms

### Delegated Proof of Stake (DPoS)
- Token holders vote for delegates who validate transactions
- Faster and more scalable than traditional PoS
- Used by EOS and Tron

### Proof of Authority (PoA)
- Pre-approved validators with known identities
- High performance and energy efficient
- Suitable for private and consortium blockchains

### Practical Byzantine Fault Tolerance (pBFT)
- Handles up to 1/3 malicious nodes
- Immediate finality
- Used in permissioned networks

## Choosing the Right Consensus

The choice of consensus mechanism depends on:
- **Security Requirements**: How much security is needed?
- **Scalability Needs**: How many transactions per second?
- **Decentralization Goals**: How distributed should the network be?
- **Energy Constraints**: What's the acceptable energy consumption?
- **Governance Model**: Who should control the network?

Understanding consensus mechanisms is crucial for evaluating different blockchain platforms and their trade-offs.`,
                  order: 2
                },
                {
                  id: "blockchain-types",
                  title: "Types of Blockchain Networks",
                  content: `Explore different types of blockchain networks and their use cases.

## Public Blockchains

Open networks where anyone can participate, view transactions, and contribute to consensus.

### Characteristics:
- **Permissionless**: No restrictions on participation
- **Transparent**: All transactions are publicly visible
- **Decentralized**: No central authority
- **Immutable**: Extremely difficult to alter historical data

### Examples:
- **Bitcoin**: Digital currency and store of value
- **Ethereum**: Smart contracts and decentralized applications
- **Litecoin**: Faster Bitcoin alternative
- **Cardano**: Research-driven blockchain platform

### Use Cases:
- Cryptocurrency payments
- Decentralized finance (DeFi)
- Non-fungible tokens (NFTs)
- Decentralized autonomous organizations (DAOs)

### Advantages:
- Maximum decentralization and security
- Global accessibility
- Censorship resistance
- Network effects and adoption

### Disadvantages:
- Scalability limitations
- High energy consumption (PoW)
- Regulatory uncertainty
- Slower transaction speeds

## Private Blockchains

Restricted networks controlled by a single organization or consortium.

### Characteristics:
- **Permissioned**: Access controlled by administrators
- **Private**: Transaction details not publicly visible
- **Centralized Control**: Single entity manages the network
- **Customizable**: Can be tailored to specific needs

### Examples:
- **Hyperledger Fabric**: Enterprise blockchain framework
- **R3 Corda**: Financial services blockchain
- **JPM Coin**: JPMorgan's internal cryptocurrency

### Use Cases:
- Supply chain management
- Internal record keeping
- Compliance and auditing
- Inter-departmental transactions

### Advantages:
- High performance and scalability
- Privacy and confidentiality
- Regulatory compliance
- Lower costs

### Disadvantages:
- Centralization risks
- Limited transparency
- Reduced security guarantees
- Vendor lock-in potential

## Consortium Blockchains

Semi-decentralized networks controlled by a group of organizations.

### Characteristics:
- **Semi-Permissioned**: Limited number of validators
- **Shared Control**: Multiple organizations govern
- **Selective Transparency**: Visible to consortium members
- **Collaborative**: Designed for industry cooperation

### Examples:
- **Energy Web Chain**: Energy sector consortium
- **IBM Food Trust**: Food supply chain tracking
- **Marco Polo**: Trade finance network

### Use Cases:
- Industry-wide standards
- Cross-organizational workflows
- Regulatory compliance
- Shared infrastructure

### Advantages:
- Balanced decentralization
- Industry-specific optimization
- Shared costs and benefits
- Regulatory alignment

### Disadvantages:
- Coordination complexity
- Potential for collusion
- Limited public benefit
- Governance challenges

## Hybrid Blockchains

Combine elements of public and private blockchains.

### Characteristics:
- **Selective Access**: Different permissions for different users
- **Flexible Privacy**: Public and private data coexist
- **Customizable Consensus**: Different rules for different participants
- **Interoperability**: Can connect to other blockchain types

### Examples:
- **XinFin**: Hybrid blockchain for trade finance
- **Dragonchain**: Disney's blockchain platform

### Use Cases:
- Healthcare records (private patient data, public research)
- Government services (public transparency, private citizen data)
- Financial services (public compliance, private transactions)

## Choosing the Right Blockchain Type

Consider these factors:

### Trust Requirements:
- **High Trust Needed**: Public blockchain
- **Known Participants**: Private or consortium
- **Mixed Environment**: Hybrid blockchain

### Performance Needs:
- **High Throughput**: Private or consortium
- **Global Scale**: Public blockchain
- **Variable Load**: Hybrid blockchain

### Regulatory Environment:
- **Strict Compliance**: Private or consortium
- **Regulatory Uncertainty**: Public blockchain
- **Mixed Requirements**: Hybrid blockchain

Understanding these different types helps you choose the right blockchain architecture for your specific use case and requirements.`,
                  order: 3
                },
                {
                  id: "practical-applications",
                  title: "Real-World Applications",
                  content: `Discover how blockchain technology is transforming various industries.

## Financial Services

Blockchain is revolutionizing traditional finance through decentralization and automation.

### Cryptocurrencies
- **Digital Payments**: Instant, low-cost global transfers
- **Store of Value**: Digital gold alternative (Bitcoin)
- **Programmable Money**: Smart contract-enabled currencies

### Decentralized Finance (DeFi)
- **Lending Protocols**: Automated lending without banks
- **Decentralized Exchanges**: Peer-to-peer trading
- **Yield Farming**: Earning returns on crypto assets
- **Synthetic Assets**: Blockchain-based derivatives

### Central Bank Digital Currencies (CBDCs)
- **Digital Fiat**: Government-issued digital currencies
- **Monetary Policy**: Enhanced control and transparency
- **Financial Inclusion**: Banking for the unbanked

## Supply Chain Management

Track products from origin to consumer with unprecedented transparency.

### Food Safety
- **Walmart**: Tracking food products to prevent contamination
- **Provenance**: Verifying organic and fair-trade claims
- **Traceability**: Quick identification of contamination sources

### Luxury Goods
- **Anti-Counterfeiting**: Verify authenticity of luxury items
- **Ownership History**: Track previous owners and transactions
- **Insurance**: Simplified claims with verified provenance

### Pharmaceuticals
- **Drug Authentication**: Prevent counterfeit medications
- **Cold Chain Monitoring**: Ensure proper storage conditions
- **Regulatory Compliance**: Automated reporting and auditing

## Healthcare

Secure and interoperable health data management.

### Medical Records
- **Patient Control**: Patients own and control their data
- **Interoperability**: Seamless sharing between providers
- **Privacy**: Encrypted, permissioned access to sensitive data

### Drug Development
- **Clinical Trials**: Transparent and tamper-proof trial data
- **Regulatory Approval**: Streamlined approval processes
- **Intellectual Property**: Secure patent and research protection

### Insurance
- **Claims Processing**: Automated claim verification and payment
- **Fraud Prevention**: Immutable record of medical history
- **Risk Assessment**: Better data for actuarial calculations

## Real Estate

Digitizing property ownership and transactions.

### Property Records
- **Title Management**: Immutable ownership records
- **Transfer Process**: Faster, cheaper property transfers
- **Fractional Ownership**: Tokenized real estate investment

### Smart Contracts
- **Rental Agreements**: Automated rent collection and deposits
- **Escrow Services**: Trustless transaction facilitation
- **Property Management**: Automated maintenance and payments

## Voting and Governance

Transparent and tamper-proof democratic processes.

### Electronic Voting
- **Transparency**: Publicly verifiable vote counting
- **Security**: Cryptographically secured ballots
- **Accessibility**: Remote voting capabilities
- **Auditability**: Permanent record of all votes

### Corporate Governance
- **Shareholder Voting**: Transparent proxy voting
- **Board Elections**: Secure director elections
- **Proposal Tracking**: Immutable record of corporate decisions

## Digital Identity

Self-sovereign identity management.

### Identity Verification
- **KYC/AML**: Streamlined compliance processes
- **Credential Verification**: Academic and professional credentials
- **Access Control**: Secure building and system access

### Privacy Protection
- **Zero-Knowledge Proofs**: Prove identity without revealing data
- **Selective Disclosure**: Share only necessary information
- **Data Ownership**: Users control their personal data

## Intellectual Property

Protecting and monetizing creative works.

### Copyright Protection
- **Timestamping**: Prove creation date and ownership
- **Licensing**: Automated royalty distribution
- **Anti-Piracy**: Track unauthorized use

### Patents
- **Prior Art**: Immutable record of innovations
- **Licensing Agreements**: Smart contract-based licensing
- **Collaboration**: Secure sharing of research data

## Energy and Sustainability

Creating more efficient and transparent energy markets.

### Renewable Energy Trading
- **Peer-to-Peer Trading**: Direct energy trading between producers and consumers
- **Carbon Credits**: Transparent carbon offset markets
- **Grid Management**: Automated energy distribution

### Sustainability Tracking
- **Carbon Footprint**: Track and verify emissions data
- **Sustainable Sourcing**: Verify environmental claims
- **Circular Economy**: Track product lifecycle and recycling

## Challenges and Considerations

### Technical Challenges
- **Scalability**: Handling millions of transactions
- **Interoperability**: Connecting different blockchain networks
- **User Experience**: Making blockchain user-friendly

### Regulatory Challenges
- **Legal Framework**: Evolving regulatory landscape
- **Compliance**: Meeting industry-specific requirements
- **International Coordination**: Cross-border regulatory alignment

### Adoption Challenges
- **Education**: Understanding blockchain benefits
- **Integration**: Connecting with existing systems
- **Change Management**: Organizational transformation

The future of blockchain lies in solving real-world problems while addressing these challenges through continued innovation and collaboration.`,
                  order: 4
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 50
            },
            {
              id: "course2",
              title: "Smart Contracts & DApp Development",
              description: "Master smart contract development and build decentralized applications. Learn Solidity, Web3.js, and modern DApp architecture patterns.",
              educator_id: "dr-priya-sharma",
              educator_name: "Dr. Priya Sharma",
              institution: "IIT Delhi - Computer Science & Engineering",
              difficulty: "Intermediate",
              duration: "8 weeks",
              rating: 4.9,
              enrolled_count: 892,
              sections: [
                {
                  id: "smart-contract-basics",
                  title: "Smart Contract Basics",
                  content: `Introduction to smart contracts and their revolutionary potential.

## What are Smart Contracts?

Smart contracts are self-executing contracts with terms directly written into code. They automatically execute when predetermined conditions are met, eliminating the need for intermediaries.

### Key Characteristics:

1. **Autonomous**: Execute automatically without human intervention
2. **Transparent**: Code is visible on the blockchain
3. **Immutable**: Cannot be changed once deployed (unless designed with upgrade mechanisms)
4. **Deterministic**: Same inputs always produce same outputs
5. **Distributed**: Executed across multiple nodes

### Benefits:

- **Trust**: No need to trust counterparties
- **Cost Reduction**: Eliminate intermediaries and their fees
- **Speed**: Instant execution when conditions are met
- **Accuracy**: Reduce human error in contract execution
- **Transparency**: All parties can verify contract terms

### Use Cases:

- **Insurance**: Automated claim processing
- **Supply Chain**: Automatic payments upon delivery
- **Real Estate**: Escrow and title transfers
- **Finance**: Lending, borrowing, and trading protocols
- **Gaming**: In-game asset ownership and trading

## Ethereum Virtual Machine (EVM)

The EVM is a runtime environment for smart contracts on Ethereum.

### EVM Features:

- **Turing Complete**: Can execute any computation
- **Isolated**: Contracts run in sandboxed environment
- **Deterministic**: Same code produces same results
- **Gas Metered**: Prevents infinite loops and spam

### Gas System:

- **Gas**: Unit of computational work
- **Gas Price**: Cost per unit of gas (in wei)
- **Gas Limit**: Maximum gas willing to spend
- **Gas Used**: Actual gas consumed by transaction

## Smart Contract Lifecycle

### 1. Development
- Write contract code in Solidity
- Define contract logic and state variables
- Implement functions and modifiers
- Add events for logging

### 2. Testing
- Unit testing with frameworks like Truffle or Hardhat
- Integration testing on test networks
- Security auditing and code review
- Gas optimization

### 3. Deployment
- Compile contract to bytecode
- Deploy to blockchain network
- Verify contract source code
- Initialize contract state

### 4. Interaction
- Call contract functions
- Send transactions to modify state
- Query contract data
- Monitor events and logs

### 5. Maintenance
- Monitor contract performance
- Handle upgrades (if designed for upgradeability)
- Manage access controls
- Respond to security issues

## Smart Contract Platforms

### Ethereum
- **First**: Original smart contract platform
- **Mature**: Large ecosystem and developer tools
- **Expensive**: High gas fees during congestion
- **Secure**: Battle-tested and widely audited

### Binance Smart Chain (BSC)
- **Fast**: Higher throughput than Ethereum
- **Cheap**: Lower transaction fees
- **Compatible**: EVM-compatible
- **Centralized**: More centralized than Ethereum

### Polygon
- **Layer 2**: Ethereum scaling solution
- **Fast**: High transaction throughput
- **Cheap**: Very low fees
- **Interoperable**: Easy bridging to Ethereum

### Solana
- **Fast**: Very high transaction speeds
- **Cheap**: Low transaction costs
- **Different**: Uses Rust instead of Solidity
- **Growing**: Rapidly expanding ecosystem

## Common Smart Contract Patterns

### Access Control
\`\`\`solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
}
\`\`\`

### Circuit Breaker
\`\`\`solidity
bool public stopped = false;

modifier stopInEmergency() {
    require(!stopped, "Contract is stopped");
    _;
}
\`\`\`

### Pull Payment
\`\`\`solidity
mapping(address => uint) public payments;

function withdraw() public {
    uint payment = payments[msg.sender];
    payments[msg.sender] = 0;
    payable(msg.sender).transfer(payment);
}
\`\`\`

Understanding these fundamentals is crucial before diving into actual smart contract development.`,
                  order: 0
                },
                {
                  id: "solidity-programming",
                  title: "Solidity Programming Language",
                  content: `Master Solidity, the primary language for Ethereum smart contracts.

## Solidity Basics

Solidity is a statically-typed programming language designed for developing smart contracts on Ethereum.

### Contract Structure

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // State variables
    uint256 public myNumber;
    address public owner;
    
    // Events
    event NumberChanged(uint256 newNumber);
    
    // Constructor
    constructor() {
        owner = msg.sender;
        myNumber = 0;
    }
    
    // Functions
    function setNumber(uint256 _number) public {
        require(msg.sender == owner, "Only owner can set number");
        myNumber = _number;
        emit NumberChanged(_number);
    }
}
\`\`\`

### Data Types

#### Value Types
- **bool**: true or false
- **int/uint**: Signed/unsigned integers (8 to 256 bits)
- **address**: 20-byte Ethereum address
- **bytes**: Fixed-size byte arrays (bytes1 to bytes32)
- **string**: Dynamic UTF-8 encoded string

#### Reference Types
- **arrays**: Dynamic or fixed-size arrays
- **mapping**: Hash tables (key-value pairs)
- **struct**: Custom data structures

### Functions

#### Visibility Modifiers
- **public**: Accessible from anywhere
- **private**: Only within the same contract
- **internal**: Within contract and derived contracts
- **external**: Only from outside the contract

#### State Mutability
- **view**: Reads state but doesn't modify it
- **pure**: Neither reads nor modifies state
- **payable**: Can receive Ether
- **nonpayable**: Cannot receive Ether (default)

### Example: Simple Token Contract

\`\`\`solidity
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name = "SimpleToken";
    string public symbol = "STK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _totalSupply) {
        totalSupply = _totalSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        require(_to != address(0), "Invalid address");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
}
\`\`\`

### Advanced Features

#### Modifiers
\`\`\`solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
}

modifier validAddress(address _addr) {
    require(_addr != address(0), "Invalid address");
    _;
}
\`\`\`

#### Inheritance
\`\`\`solidity
contract Owned {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
}

contract MyContract is Owned {
    function restrictedFunction() public onlyOwner {
        // Only owner can call this
    }
}
\`\`\`

#### Libraries
\`\`\`solidity
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }
}

contract MyContract {
    using SafeMath for uint256;
    
    function calculate(uint256 a, uint256 b) public pure returns (uint256) {
        return a.add(b);
    }
}
\`\`\`

### Error Handling

#### require()
\`\`\`solidity
function withdraw(uint256 amount) public {
    require(balance[msg.sender] >= amount, "Insufficient balance");
    // Continue execution
}
\`\`\`

#### assert()
\`\`\`solidity
function divide(uint256 a, uint256 b) public pure returns (uint256) {
    assert(b != 0); // Should never be false
    return a / b;
}
\`\`\`

#### revert()
\`\`\`solidity
function complexFunction(uint256 value) public {
    if (value < 10) {
        revert("Value too small");
    }
    // Continue execution
}
\`\`\`

### Best Practices

1. **Use Latest Compiler Version**: Stay updated with security fixes
2. **Check for Overflows**: Use SafeMath or Solidity 0.8+ built-in checks
3. **Validate Inputs**: Always check function parameters
4. **Use Events**: Log important state changes
5. **Follow Naming Conventions**: Use clear, descriptive names
6. **Optimize Gas Usage**: Minimize storage operations
7. **Handle Failures Gracefully**: Use proper error handling
8. **Test Thoroughly**: Write comprehensive tests

### Common Pitfalls

1. **Reentrancy Attacks**: Use checks-effects-interactions pattern
2. **Integer Overflow/Underflow**: Use SafeMath or Solidity 0.8+
3. **Gas Limit Issues**: Avoid unbounded loops
4. **Timestamp Dependence**: Don't rely on block.timestamp for critical logic
5. **Uninitialized Storage**: Initialize all variables
6. **Delegatecall Vulnerabilities**: Understand delegatecall behavior

Mastering Solidity is essential for building secure and efficient smart contracts.`,
                  order: 1
                },
                {
                  id: "dapp-architecture",
                  title: "DApp Architecture & Web3 Integration",
                  content: `Learn how to build complete decentralized applications with modern web technologies.

## DApp Architecture Overview

A decentralized application (DApp) consists of several layers working together:

### Frontend Layer
- **User Interface**: React, Vue, or Angular applications
- **Web3 Integration**: Libraries like Web3.js or Ethers.js
- **Wallet Connection**: MetaMask, WalletConnect integration
- **State Management**: Redux, Context API for application state

### Blockchain Layer
- **Smart Contracts**: Business logic on blockchain
- **Events**: Contract events for real-time updates
- **Transactions**: State-changing operations
- **Queries**: Reading blockchain state

### Infrastructure Layer
- **IPFS**: Decentralized file storage
- **The Graph**: Blockchain data indexing
- **Infura/Alchemy**: Blockchain node providers
- **ENS**: Ethereum Name Service for human-readable addresses

## Web3.js Integration

Web3.js is a JavaScript library for interacting with Ethereum blockchain.

### Installation and Setup
\`\`\`javascript
npm install web3

import Web3 from 'web3';

// Connect to local node
const web3 = new Web3('http://localhost:8545');

// Connect to Infura
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// Connect to MetaMask
if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
}
\`\`\`

### Contract Interaction
\`\`\`javascript
// Contract ABI and address
const contractABI = [...]; // Your contract ABI
const contractAddress = '0x...'; // Your contract address

// Create contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Read data (view functions)
const result = await contract.methods.myViewFunction().call();

// Write data (state-changing functions)
const accounts = await web3.eth.getAccounts();
await contract.methods.myFunction(param1, param2).send({
    from: accounts[0],
    gas: 200000
});

// Listen to events
contract.events.MyEvent({
    fromBlock: 'latest'
}, (error, event) => {
    console.log('Event received:', event);
});
\`\`\`

## React DApp Example

### App Component
\`\`\`jsx
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ContractABI from './ContractABI.json';

const CONTRACT_ADDRESS = '0x...';

function App() {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [balance, setBalance] = useState('0');

    useEffect(() => {
        initWeb3();
    }, []);

    const initWeb3 = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            // Request account access
            await window.ethereum.enable();
            const accounts = await web3Instance.eth.getAccounts();
            setAccount(accounts[0]);

            // Initialize contract
            const contractInstance = new web3Instance.eth.Contract(
                ContractABI,
                CONTRACT_ADDRESS
            );
            setContract(contractInstance);

            // Get initial balance
            const userBalance = await contractInstance.methods
                .balanceOf(accounts[0])
                .call();
            setBalance(userBalance);
        }
    };

    const transferTokens = async (to, amount) => {
        try {
            await contract.methods.transfer(to, amount).send({
                from: account
            });
            // Refresh balance
            const newBalance = await contract.methods
                .balanceOf(account)
                .call();
            setBalance(newBalance);
        } catch (error) {
            console.error('Transfer failed:', error);
        }
    };

    return (
        <div className="App">
            <h1>My DApp</h1>
            <p>Account: {account}</p>
            <p>Balance: {balance}</p>
            {/* Add your UI components here */}
        </div>
    );
}

export default App;
\`\`\`

### Custom Hooks for Web3
\`\`\`jsx
import { useState, useEffect } from 'react';
import Web3 from 'web3';

export const useWeb3 = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                // Check if already connected
                const accounts = await web3Instance.eth.getAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                }

                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        setIsConnected(true);
                    } else {
                        setAccount('');
                        setIsConnected(false);
                    }
                });
            }
        };

        initWeb3();
    }, []);

    const connect = async () => {
        if (window.ethereum) {
            await window.ethereum.enable();
            const accounts = await web3.eth.getAccounts();
            setAccount(accounts[0]);
            setIsConnected(true);
        }
    };

    return { web3, account, isConnected, connect };
};
\`\`\`

## IPFS Integration

IPFS (InterPlanetary File System) provides decentralized storage for DApp assets.

### Setup IPFS
\`\`\`javascript
npm install ipfs-http-client

import { create } from 'ipfs-http-client';

const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
});

// Upload file to IPFS
const uploadToIPFS = async (file) => {
    try {
        const result = await ipfs.add(file);
        return result.path; // IPFS hash
    } catch (error) {
        console.error('IPFS upload failed:', error);
    }
};

// Retrieve file from IPFS
const getFromIPFS = (hash) => {
    return \`https://ipfs.infura.io/ipfs/\${hash}\`;
};
\`\`\`

## The Graph Integration

The Graph provides indexed blockchain data through GraphQL APIs.

### GraphQL Query
\`\`\`javascript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/your-subgraph',
    cache: new InMemoryCache()
});

const GET_TOKENS = gql\`
    query GetTokens($first: Int!, $skip: Int!) {
        tokens(first: $first, skip: $skip) {
            id
            name
            symbol
            totalSupply
        }
    }
\`;

const { loading, error, data } = useQuery(GET_TOKENS, {
    variables: { first: 10, skip: 0 }
});
\`\`\`

## Testing DApps

### Unit Testing Smart Contracts
\`\`\`javascript
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MyToken', function () {
    let token;
    let owner;
    let addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        const Token = await ethers.getContractFactory('MyToken');
        token = await Token.deploy(1000);
    });

    it('Should transfer tokens between accounts', async function () {
        await token.transfer(addr1.address, 50);
        expect(await token.balanceOf(addr1.address)).to.equal(50);
    });
});
\`\`\`

### Frontend Testing
\`\`\`javascript
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock Web3
jest.mock('web3');

test('connects to wallet', async () => {
    render(<App />);
    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);
    // Add assertions
});
\`\`\`

## Deployment Strategies

### Frontend Deployment
- **IPFS**: Fully decentralized hosting
- **Netlify/Vercel**: Traditional hosting with CI/CD
- **ENS**: Human-readable domain names

### Smart Contract Deployment
\`\`\`javascript
// Hardhat deployment script
async function main() {
    const MyContract = await ethers.getContractFactory('MyContract');
    const contract = await MyContract.deploy();
    await contract.deployed();
    console.log('Contract deployed to:', contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
\`\`\`

## Security Considerations

1. **Input Validation**: Validate all user inputs
2. **Access Control**: Implement proper permissions
3. **Rate Limiting**: Prevent spam and abuse
4. **Error Handling**: Handle blockchain errors gracefully
5. **Private Key Security**: Never expose private keys
6. **Contract Verification**: Verify contracts on Etherscan
7. **Audit**: Get security audits for production contracts

Building robust DApps requires understanding both blockchain technology and modern web development practices.`,
                  order: 2
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 75
            }
          ];
        }
        
        return publishedCourses;
      },
      get_course: async (id: string) => {
        // First check localStorage
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = existingCourses.find((c: any) => c.id === id);
        
        if (course) {
          return course;
        }
        
        // Return default courses if not found in localStorage
        const defaultCourses = await this.courseActor.get_published_courses();
        return defaultCourses.find((c: any) => c.id === id) || null;
      },
      add_course_section: async (course_id: string, title: string, content: string) => {
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const courseIndex = existingCourses.findIndex((c: any) => c.id === course_id);
        
        if (courseIndex !== -1) {
          const newSection = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            content,
            order: existingCourses[courseIndex].sections.length
          };
          
          existingCourses[courseIndex].sections.push(newSection);
          existingCourses[courseIndex].updated_at = Date.now() * 1000000;
          localStorage.setItem('courses', JSON.stringify(existingCourses));
          
          return existingCourses[courseIndex];
        }
        
        return {
          id: course_id,
          title: "Updated Course",
          description: "Course with new section",
          educator_id: this.identity?.getPrincipal().toText() || 'mock-educator',
          sections: [
            {
              id: Math.random().toString(36).substr(2, 9),
              title,
              content,
              order: 0
            }
          ],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          published: false,
          token_reward: 10
        };
      },
      publish_course: async (course_id: string) => {
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const courseIndex = existingCourses.findIndex((c: any) => c.id === course_id);
        
        if (courseIndex !== -1) {
          existingCourses[courseIndex].published = true;
          existingCourses[courseIndex].updated_at = Date.now() * 1000000;
          localStorage.setItem('courses', JSON.stringify(existingCourses));
          
          return existingCourses[courseIndex];
        }
        
        return {
          id: course_id,
          title: "Published Course",
          description: "Course that has been published",
          educator_id: this.identity?.getPrincipal().toText() || 'mock-educator',
          sections: [],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          published: true,
          token_reward: 10
        };
      }
    };

    this.tokenActor = {
      get_balance: async () => {
        return 100;
      },
      transfer_tokens: async (to: string, amount: number, memo: string) => {
        return {
          id: Math.random().toString(36).substr(2, 9),
          from: this.identity?.getPrincipal().toText() || 'mock-sender',
          to,
          amount,
          transaction_type: 'Transfer',
          timestamp: Date.now() * 1000000,
          memo
        };
      },
      get_transaction_history: async () => {
        return [];
      },
      reward_course_completion: async (studentId: string, amount: number, courseId: string) => {
        // Mock token reward implementation
        return {
          id: Math.random().toString(36).substr(2, 9),
          recipient: studentId,
          amount,
          course_id: courseId,
          timestamp: Date.now() * 1000000
        };
      }
    };

    this.peerActor = {
      create_peer_note: async (course_id: string, author_name: string, content: string, note_type: any) => {
        return {
          id: Math.random().toString(36).substr(2, 9),
          course_id,
          author: this.identity?.getPrincipal().toText() || 'mock-author',
          author_name,
          content,
          note_type: Object.keys(note_type)[0],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          tips_received: 0
        };
      },
      get_user_notes: async () => {
        return [];
      },
      tip_peer_note: async (note_id: string, amount: number, message: string) => {
        return {
          id: Math.random().toString(36).substr(2, 9),
          note_id,
          tipper: this.identity?.getPrincipal().toText() || 'mock-tipper',
          recipient: 'mock-recipient',
          amount,
          timestamp: Date.now() * 1000000,
          message
        };
      }
    };
  }

  async login() {
    if (!this.authClient) return false;

    return new Promise<boolean>((resolve) => {
      this.authClient!.login({
        identityProvider: import.meta.env.VITE_DFX_NETWORK === 'local' 
          ? `http://127.0.0.1:4943/?canisterId=${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}`
          : 'https://identity.ic0.app',
        onSuccess: () => {
          this.identity = this.authClient!.getIdentity();
          this.agent = new HttpAgent({
            host,
            identity: this.identity,
          });
          this.createActors();
          resolve(true);
        },
        onError: () => resolve(false),
      });
    });
  }

  async logout() {
    if (!this.authClient) return;
    await this.authClient.logout();
    this.identity = null;
    this.agent = null;
    this.studentActor = null;
    this.courseActor = null;
    this.tokenActor = null;
    this.peerActor = null;
  }

  isAuthenticated(): boolean {
    return this.identity !== null && !this.identity.getPrincipal().isAnonymous();
  }

  getPrincipal() {
    return this.identity?.getPrincipal();
  }

  // Actor getters
  get student() {
    return this.studentActor;
  }

  get course() {
    return this.courseActor;
  }

  get token() {
    return this.tokenActor;
  }

  get peer() {
    return this.peerActor;
  }
}

export const agentService = new AgentService();